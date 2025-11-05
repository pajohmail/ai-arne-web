<?php
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

// Anropa Cloud Function chatHandler
// Cloud Function URL bör vara konfigurerad i config.php som CHAT_FUNCTION_URL
$chatFunctionUrl = defined('CHAT_FUNCTION_URL') ? CHAT_FUNCTION_URL : null;

if (!$chatFunctionUrl) {
  // Fallback: Försök använda standard Cloud Function URL-format
  // Detta är en placeholder - användaren behöver konfigurera rätt URL
  $chatFunctionUrl = 'https://europe-north1-' . FIRESTORE_PROJECT_ID . '.cloudfunctions.net/chatHandler';
}

$payload = json_encode([
  'question' => $question,
  'sessionId' => $sessionId
]);

$ch = curl_init($chatFunctionUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
  sendError('Fel vid anrop till Cloud Function: ' . $curlError, 500);
}

if ($httpCode !== 200) {
  $errorData = json_decode($response, true);
  $errorMsg = $errorData['error'] ?? 'Okänt fel från Cloud Function';
  sendError($errorMsg, $httpCode);
}

$result = json_decode($response, true);
if (!$result || !isset($result['ok']) || !$result['ok']) {
  $errorMsg = $result['error'] ?? 'Okänt fel från Cloud Function';
  sendError($errorMsg, 500);
}

echo json_encode([
  'success' => true,
  'data' => [
    'answer' => $result['answer'] ?? '',
    'provider' => $result['provider'] ?? 'unknown'
  ]
], JSON_UNESCAPED_UNICODE);

