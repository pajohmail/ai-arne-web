<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$limit = max(1, min($limit, 100)); // Begränsa mellan 1 och 100
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$structuredQuery = [
  'from' => [['collectionId' => 'tutorials']],
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
  $tutorials = [];
  
  foreach ($data as $row) {
    $normalized = normalizeTutorial($row);
    if ($normalized) {
      $tutorials[] = $normalized;
    }
  }
  
  // Applicera offset genom att skära array
  if ($offset > 0 && count($tutorials) > $offset) {
    $tutorials = array_slice($tutorials, $offset, $limit);
  } elseif ($offset > 0) {
    // Om offset är större än antal items, returnera tom array
    $tutorials = [];
  }
  
  echo json_encode(['success' => true, 'data' => $tutorials], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  sendError('Fel vid hämtning av tutorials: ' . $e->getMessage(), 500);
}

