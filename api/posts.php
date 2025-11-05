<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$limit = max(1, min($limit, 100)); // Begränsa mellan 1 och 100
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$structuredQuery = [
  'from' => [['collectionId' => 'posts']],
  'orderBy' => [[
    'field' => ['fieldPath' => 'createdAt'],
    'direction' => 'DESCENDING'
  ]],
  'limit' => $limit
];

// För offset-stöd, hämta fler items och skär tillbaka
// Firestore stödjer inte direkt offset, så vi hämtar limit + offset items
$queryLimit = $offset > 0 ? $limit + $offset : $limit;
$structuredQuery['limit'] = $queryLimit;

try {
  $data = queryFirestore($structuredQuery);
  $posts = [];
  
  foreach ($data as $row) {
    $normalized = normalizePost($row);
    if ($normalized) {
      $posts[] = $normalized;
    }
  }
  
  // Applicera offset genom att skära array
  if ($offset > 0 && count($posts) > $offset) {
    $posts = array_slice($posts, $offset, $limit);
  } elseif ($offset > 0) {
    // Om offset är större än antal items, returnera tom array
    $posts = [];
  }
  
  echo json_encode(['success' => true, 'data' => $posts], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  sendError('Fel vid hämtning av posts: ' . $e->getMessage(), 500);
}

