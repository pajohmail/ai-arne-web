<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$limit = max(1, min($limit, 100)); // Begränsa mellan 1 och 100

$structuredQuery = [
  'from' => [['collectionId' => 'user_questions']],
  'orderBy' => [[
    'field' => ['fieldPath' => 'createdAt'],
    'direction' => 'DESCENDING'
  ]],
  'limit' => $limit
];

try {
  $data = queryFirestore($structuredQuery);
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
  // Om det är ett 403-fel, kan det vara att collection inte finns ännu
  // Returnera tom array istället för fel
  $errorMsg = $e->getMessage();
  if (strpos($errorMsg, '403') !== false || strpos($errorMsg, 'permission') !== false) {
    // Collection kanske inte finns ännu - returnera tom array
    echo json_encode(['success' => true, 'data' => []], JSON_UNESCAPED_UNICODE);
  } else {
    sendError('Fel vid hämtning av sparade frågor: ' . $errorMsg, 500);
  }
}

