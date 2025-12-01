<?php
/**
 * Chat API endpoint för AI-Arne
 * 
 * Hanterar chat-förfrågningar från webbplatsen och genererar AI-svar
 * med OpenAI Responses API. Optimerad för snabba svar (200-300 ord, ~30-60 sekunder).
 * 
 * @file api/chat.php
 * @version 2.0
 * 
 * Optimeringar:
 * - Förenklad prompt (200-300 ord istället för 500+)
 * - max_output_tokens: 1000 (istället för 1500)
 * - text.verbosity: 'low' för kortare svar
 * - Automatisk kontroll för kompletta meningar
 * - Timeout: 120 sekunder (istället för 60)
 */

// Öka execution time limit för att hantera långa AI-anrop (max 4 minuter)
set_time_limit(240);
ini_set('max_execution_time', 240);

// Aktivera error reporting för debugging (ta bort i produktion om det inte behövs)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Visa inte fel i output, bara logga
ini_set('log_errors', 1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders(true); // Tillåt POST

// Endast POST tillåten för chat
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  sendError('Endast POST tillåten', 405);
}

// Läs JSON body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['question']) || empty(trim($data['question']))) {
  sendError('Frågan saknas eller är ogiltig', 400);
}

$question = trim($data['question']);
$sessionId = $data['sessionId'] ?? null;

// Enkel validering - blockera uppenbart irrelevanta frågor
$obviousIrrelevantKeywords = [
  'recept', 'mat', 'matlagning', 'kök', 'baka', 'tårta', 'kaka',
  'middag', 'lunch', 'frukost', 'ingrediens', 'kräm', 'sås',
  'sport', 'fotboll', 'hockey', 'tennis', 'golf', 'träning',
  'hälsa', 'sjukdom', 'medicin', 'läkare', 'sjukvård'
];
$qLower = strtolower($question);
$isObviouslyIrrelevant = false;
foreach ($obviousIrrelevantKeywords as $keyword) {
  if (strpos($qLower, $keyword) !== false) {
    $isObviouslyIrrelevant = true;
    break;
  }
}

if ($isObviouslyIrrelevant) {
  sendError('Frågan verkar inte vara relaterad till AI eller teknologi. Försök igen med en relevant fråga.', 400);
}

// Bygg prompt
$currentDate = date('j F Y', strtotime('now'));
$currentYear = date('Y');
$currentMonth = date('m');

$prompt = "Du är en AI-nyhetsexpert som svarar på frågor om AI-nyheter och utveckling på ett underhållande sätt med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela svaret.

VIKTIGT - DAGENS DATUM: {$currentDate} ({$currentYear}-{$currentMonth})

Frågan: {$question}

INSTRUKTIONER:
- Svara på svenska med ett engagerande och underhållande svar (200-300 ord)
- Var informativ men koncis - fokusera på det viktigaste
- Använd ironi och svenska humor för att göra läsningen engagerande
- Inkludera relevant kontext och bakgrund när det är lämpligt
- Om informationen är äldre än 6 månader, markera det tydligt
- Avsluta alltid med en komplett mening - klipp inte mitt i en mening";

// Funktion för att säkerställa att texten slutar med en komplett mening
function ensureCompleteSentence($text) {
  if (empty($text)) {
    return $text;
  }
  
  // Trimma bort whitespace
  $text = rtrim($text);
  
  // Om texten redan slutar med en meningsavslutare, returnera som den är
  $sentenceEnders = ['.', '!', '?', ':', ';'];
  $lastChar = substr($text, -1);
  
  if (in_array($lastChar, $sentenceEnders)) {
    return $text;
  }
  
  // Om texten inte slutar med en meningsavslutare, hitta sista kompletta meningen
  // Sök bakåt efter sista meningsavslutare
  $lastSentenceEnd = -1;
  foreach ($sentenceEnders as $ender) {
    $pos = strrpos($text, $ender);
    if ($pos !== false && $pos > $lastSentenceEnd) {
      $lastSentenceEnd = $pos;
    }
  }
  
  // Om vi hittade en meningsavslutare, klipp texten där
  if ($lastSentenceEnd !== -1) {
    return substr($text, 0, $lastSentenceEnd + 1);
  }
  
  // Om ingen meningsavslutare hittades, returnera texten som den är
  // (kan hända om texten är mycket kort eller bara en mening)
  return $text;
}

// Funktion för att spara fråga i Firestore
function saveUserQuestionToFirestore($question, $sessionId = null) {
  if (!defined('FIRESTORE_PROJECT_ID') || !defined('FIRESTORE_API_KEY')) {
    return false; // Tyst fail om config saknas
  }
  
  $url = "https://firestore.googleapis.com/v1/projects/" . FIRESTORE_PROJECT_ID .
         "/databases/(default)/documents/user_questions?key=" . FIRESTORE_API_KEY;
  
  $document = [
    'fields' => [
      'question' => ['stringValue' => $question],
      'createdAt' => ['timestampValue' => date('c')]
    ]
  ];
  
  if ($sessionId) {
    $document['fields']['sessionId'] = ['stringValue' => $sessionId];
  }
  
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($document));
  curl_setopt($ch, CURLOPT_TIMEOUT, 10);
  
  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  
  return $httpCode === 200;
}

// Spara frågan i Firestore (tyst fail om det misslyckas)
saveUserQuestionToFirestore($question, $sessionId);

// Anropa OpenAI med gpt-5 modell
$openaiApiKey = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : null;

if (!$openaiApiKey) {
  error_log("OPENAI_API_KEY saknas i config.php");
  sendError('OPENAI_API_KEY saknas i config.php', 500);
}

$answer = null;
$provider = 'openai';

// Wrap allt i try-catch för att fånga oväntade fel
try {

// Försök först med Responses API (gpt-5 modeller - synkront anrop)
$apiUrl = 'https://api.openai.com/v1/responses';

$requestData = [
  'model' => 'gpt-5-mini', // Använd gpt-5-mini för snabbare svar
  'input' => $prompt,
  'max_output_tokens' => 1000, // Minskat från 1500 för snabbare svar
  'reasoning' => ['effort' => 'low'], // Snabbare svar (enligt OpenAI docs)
  'text' => ['verbosity' => 'low'], // Kortare svar (Responses API stödjer inte temperature, använd text.verbosity istället)
];

// Logga request för debugging (ta bort i produktion)
error_log("OpenAI Responses API request: " . json_encode([
  'model' => $requestData['model'],
  'input_length' => strlen($requestData['input']),
  'max_output_tokens' => $requestData['max_output_tokens'],
  'has_reasoning' => isset($requestData['reasoning']),
  'api_key_prefix' => substr($openaiApiKey, 0, 10) . '...' // Logga bara prefix för säkerhet
]));

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Content-Type: application/json',
  'Authorization: Bearer ' . $openaiApiKey
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 120 sekunder timeout för synkront svar

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Hantera svaret - Responses API är synkront, svaret kommer direkt
if ($curlError || $httpCode !== 200) {
  error_log("OpenAI Responses API error: HTTP $httpCode, cURL: $curlError");
  error_log("OpenAI Responses API full response: " . $response);
  // Om det är ett JSON-fel, försök parsea det
  $errorData = json_decode($response, true);
  if ($errorData && isset($errorData['error'])) {
    error_log("OpenAI Responses API error details: " . json_encode($errorData['error']));
  }
  $answer = null; // Gå till fallback
} else {
  $responseData = json_decode($response, true);
  
  if (isset($responseData['error'])) {
    $errorMsg = $responseData['error']['message'] ?? 'Unknown error';
    $errorType = $responseData['error']['type'] ?? 'unknown';
    error_log("OpenAI Responses API error: $errorType - $errorMsg");
    $answer = null; // Gå till fallback
  } elseif (isset($responseData['output_text'])) {
    // *** ENKLA VÄGEN - direkt från synkront svar ***
    $answer = ensureCompleteSentence($responseData['output_text']);
    error_log("OpenAI Responses API: Got answer via output_text (length: " . strlen($answer) . ")");
  } elseif (isset($responseData['output'][0]['content'][0]['text'])) {
    // Mer low-level sätt
    $answer = ensureCompleteSentence($responseData['output'][0]['content'][0]['text']);
    error_log("OpenAI Responses API: Got answer via output[0].content[0].text (length: " . strlen($answer) . ")");
  } else {
    // Logga att svaret inte innehöll text
    error_log("OpenAI Responses API: no text in response. Response structure: " . json_encode(array_keys($responseData ?? [])));
    error_log("OpenAI Responses API full response: " . substr($response, 0, 1000));
    $answer = null; // Gå till fallback
  }
}

// Fallback till Chat Completions API om Responses API inte fungerar
// OBS: gpt-5-modeller fungerar INTE med /v1/chat/completions, använd gpt-4.1-modeller istället
if (!$answer) {
  $apiUrl = 'https://api.openai.com/v1/chat/completions';
  
  // Prova olika gpt-4.1 modeller i fallback-ordning (de fungerar med Chat Completions)
  $models = ['gpt-4.1-mini', 'gpt-4.1'];
  
  foreach ($models as $model) {
    $requestData = [
      'model' => $model,
      'messages' => [
        ['role' => 'user', 'content' => $prompt]
      ],
      'max_tokens' => 1000, // Minskat från 1500 för snabbare svar
      'temperature' => 0.8
    ];
    
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'Content-Type: application/json',
      'Authorization: Bearer ' . $openaiApiKey
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
    curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 2 minuter timeout
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    // Logga fel för debugging
    if ($curlError || $httpCode !== 200) {
      error_log("OpenAI Chat Completions API error (model: $model): HTTP $httpCode, cURL: $curlError");
      error_log("OpenAI Chat Completions API full response: " . $response);
      // Om det är ett JSON-fel, försök parsea det
      $errorData = json_decode($response, true);
      if ($errorData && isset($errorData['error'])) {
        error_log("OpenAI Chat Completions API error details: " . json_encode($errorData['error']));
      }
    }
    
    if (!$curlError && $httpCode === 200) {
      $responseData = json_decode($response, true);
      
      // Kontrollera om det finns ett fel i response
      if (isset($responseData['error'])) {
        $errorMsg = $responseData['error']['message'] ?? 'Unknown error';
        $errorType = $responseData['error']['type'] ?? 'unknown';
        $errorCode = $responseData['error']['code'] ?? 'unknown';
        error_log("OpenAI Chat Completions API error (model: $model): $errorType ($errorCode) - $errorMsg");
        
        // Om modellen inte finns, prova nästa direkt
        if (strpos($errorMsg, 'model') !== false || strpos($errorCode, 'model') !== false) {
          continue; // Prova nästa modell
        }
        // För andra fel, försök ändå nästa modell
        continue;
      }
      
      if (isset($responseData['choices'][0]['message']['content'])) {
        $answer = ensureCompleteSentence($responseData['choices'][0]['message']['content']);
        // Kontrollera om svaret är ett felmeddelande
        if (stripos($answer, 'jag är ledsen') !== false || stripos($answer, 'i cannot') !== false) {
          error_log("OpenAI returned error message in content: " . substr($answer, 0, 200));
          $answer = null; // Sätt till null så vi kan prova nästa modell
          continue;
        }
        break; // Lyckades, sluta försöka andra modeller
      }
    }
  }
}

if (!$answer) {
  // Logga detaljerat fel för debugging
  $errorDetails = [
    'openai_key_set' => !empty($openaiApiKey),
    'openai_key_length' => $openaiApiKey ? strlen($openaiApiKey) : 0,
    'tried_responses_api' => true,
    'tried_chat_completions' => true,
    'models_tried' => ['gpt-5-mini (Responses API)', 'gpt-4.1-mini (Chat Completions)', 'gpt-4.1 (Chat Completions)']
  ];
  error_log("Failed to get answer from OpenAI. Details: " . json_encode($errorDetails));
  
  // Returnera mer detaljerat felmeddelande
  error_log("DEBUG: answer is empty, returning 500. Last HTTP code: " . ($httpCode ?? 'N/A'));
  $errorMessage = 'Kunde inte generera svar med OpenAI. ';
  if (empty($openaiApiKey)) {
    $errorMessage .= 'API-nyckel saknas i config.php. ';
  } else {
    $errorMessage .= 'API-anropet misslyckades. Kontrollera att API-nyckeln är giltig och att modellerna är tillgängliga. ';
  }
  $errorMessage .= 'Kontrollera server logs för mer information.';
  
  sendError($errorMessage, 500);
}

  echo json_encode([
    'success' => true,
    'data' => [
      'answer' => $answer,
      'provider' => $provider
    ]
  ], JSON_UNESCAPED_UNICODE);
  
} catch (Exception $e) {
  error_log("Chat.php exception: " . $e->getMessage());
  error_log("Stack trace: " . $e->getTraceAsString());
  sendError('Ett oväntat fel uppstod: ' . $e->getMessage(), 500);
} catch (Error $e) {
  error_log("Chat.php fatal error: " . $e->getMessage());
  error_log("Stack trace: " . $e->getTraceAsString());
  sendError('Ett kritiskt fel uppstod: ' . $e->getMessage(), 500);
}
