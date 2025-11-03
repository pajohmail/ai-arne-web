<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$slug = $_GET['slug'] ?? '';
if (!$slug || strlen($slug) > 200) {
  sendError('Ogiltig slug', 400);
}

$structuredQuery = [
  'from' => [['collectionId' => 'posts']],
  'where' => [
    'fieldFilter' => [
      'field' => ['fieldPath' => 'slug'],
      'op' => 'EQUAL',
      'value' => ['stringValue' => $slug]
    ]
  ],
  'limit' => 1
];

try {
  $data = queryFirestore($structuredQuery);
  
  if (empty($data) || !isset($data[0])) {
    sendError('Post hittades inte', 404);
  }
  
  $post = normalizePost($data[0]);
  if (!$post) {
    sendError('Kunde inte normalisera post', 500);
  }
  
  echo json_encode(['success' => true, 'data' => $post], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  sendError('Fel vid hämtning av post: ' . $e->getMessage(), 500);
}
?>

