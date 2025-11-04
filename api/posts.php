<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$limit = max(1, min($limit, 50)); // Begränsa mellan 1 och 50

$structuredQuery = [
  'from' => [['collectionId' => 'posts']],
  'orderBy' => [[
    'field' => ['fieldPath' => 'createdAt'],
    'direction' => 'DESCENDING'
  ]],
  'limit' => $limit
];

try {
  $data = queryFirestore($structuredQuery);
  $posts = [];
  
  foreach ($data as $row) {
    $normalized = normalizePost($row);
    if ($normalized) {
      $posts[] = $normalized;
    }
  }
  
  echo json_encode(['success' => true, 'data' => $posts], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  sendError('Fel vid hämtning av posts: ' . $e->getMessage(), 500);
}

