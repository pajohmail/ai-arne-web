<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$limit = max(1, min($limit, 200)); // Begränsa mellan 1 och 200 för att visa alla frågor

$structuredQuery = [
  'from' => [['collectionId' => 'user_questions']],
  'orderBy' => [[
    'field' => ['fieldPath' => 'createdAt'],
    'direction' => 'DESCENDING'
  ]],
  'limit' => $limit
];

// Wrapper-funktion som hanterar 403-fel gracefully
function queryFirestoreSafe($structuredQuery) {
  if (!defined('FIRESTORE_PROJECT_ID') || !defined('FIRESTORE_API_KEY')) {
    throw new Exception('Konfiguration saknas');
  }
  
  $url = "https://firestore.googleapis.com/v1/projects/" . FIRESTORE_PROJECT_ID .
         "/databases/(default)/documents:runQuery?key=" . FIRESTORE_API_KEY;
  
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['structuredQuery' => $structuredQuery]));
  curl_setopt($ch, CURLOPT_TIMEOUT, 15);
  
  $response = curl_exec($ch);
  $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  
  if ($err) {
    throw new Exception('Nätverksfel: ' . $err);
  }
  
  // För 403-fel, kasta exception med statuskod i meddelandet
  if ($http === 403) {
    throw new Exception('Firestore API fel: HTTP 403');
  }
  
  if ($http !== 200) {
    throw new Exception('Firestore API fel: HTTP ' . $http);
  }
  
  $data = json_decode($response, true);
  if (!is_array($data)) {
    throw new Exception('Ogiltigt svar från Firestore');
  }
  
  return $data;
}

try {
  $data = queryFirestoreSafe($structuredQuery);
  $questions = [];
  
  // Firestore returnerar tom array [] om inget dokument hittas eller collection är tom
  if (is_array($data)) {
    foreach ($data as $row) {
      $normalized = normalizeUserQuestion($row);
      if ($normalized) {
        $questions[] = $normalized;
      }
    }
  }
  
  // Returnera tom array om inga frågor finns (inte ett fel)
  echo json_encode(['success' => true, 'data' => $questions], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  // Om det är ett 403-fel, kan det vara att collection inte finns ännu eller saknar behörighet
  // Returnera tom array istället för fel
  $errorMsg = $e->getMessage();
  if (strpos($errorMsg, '403') !== false || strpos($errorMsg, 'permission') !== false) {
    // Collection kanske inte finns ännu eller saknar behörighet - returnera tom array
    echo json_encode(['success' => true, 'data' => []], JSON_UNESCAPED_UNICODE);
  } else {
    sendError('Fel vid hämtning av sparade frågor: ' . $errorMsg, 500);
  }
}

