<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$slug = $_GET['slug'] ?? '';
if (!$slug || strlen($slug) > 200) {
  sendError('Ogiltig slug', 400);
}

$structuredQuery = [
  'from' => [['collectionId' => 'news']],
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
    sendError('Nyhet hittades inte', 404);
  }
  
  $news = normalizeNews($data[0]);
  if (!$news) {
  sendError('Kunde inte normalisera nyhet', 500);
  }
  
  echo json_encode(['success' => true, 'data' => $news], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  sendError('Fel vid hämtning av nyhet: ' . $e->getMessage(), 500);
}

