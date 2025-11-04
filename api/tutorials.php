<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$limit = max(1, min($limit, 50)); // Begränsa mellan 1 och 50

$structuredQuery = [
  'from' => [['collectionId' => 'tutorials']],
  'orderBy' => [[
    'field' => ['fieldPath' => 'createdAt'],
    'direction' => 'DESCENDING'
  ]],
  'limit' => $limit
];

try {
  $data = queryFirestore($structuredQuery);
  $tutorials = [];
  
  foreach ($data as $row) {
    $normalized = normalizeTutorial($row);
    if ($normalized) {
      $tutorials[] = $normalized;
    }
  }
  
  echo json_encode(['success' => true, 'data' => $tutorials], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  sendError('Fel vid hämtning av tutorials: ' . $e->getMessage(), 500);
}

