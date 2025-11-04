<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_helpers.php';

sendCorsHeaders();

$postId = $_GET['postId'] ?? '';
$id = $_GET['id'] ?? '';

if (!$postId && !$id) {
  sendError('postId eller id krävs', 400);
}

if ($postId && strlen($postId) > 200) {
  sendError('Ogiltig postId', 400);
}
if ($id && strlen($id) > 200) {
  sendError('Ogiltig id', 400);
}

try {
  if ($postId) {
    // Hämta tutorial via postId
    $structuredQuery = [
      'from' => [['collectionId' => 'tutorials']],
      'where' => [
        'fieldFilter' => [
          'field' => ['fieldPath' => 'postId'],
          'op' => 'EQUAL',
          'value' => ['stringValue' => $postId]
        ]
      ],
      'limit' => 1
    ];
    
    $data = queryFirestore($structuredQuery);
    
    // Firestore returnerar tom array [] om inget dokument hittas
    if (empty($data) || !isset($data[0])) {
      sendError('Tutorial hittades inte (inget resultat från Firestore)', 404);
    }
    
    // Kontrollera om dokumentet faktiskt finns (Firestore kan returnera tom array eller array med tomt objekt)
    if (!isset($data[0]['document'])) {
      sendError('Tutorial hittades inte (dokument saknas i resultat)', 404);
    }
    
    $tutorial = normalizeTutorial($data[0]);
    if (!$tutorial) {
      // Debug: logga vad som faktiskt finns i data[0]
      $docExists = isset($data[0]['document']);
      $docName = $docExists ? ($data[0]['document']['name'] ?? 'NO NAME') : 'NO DOCUMENT';
      $fields = $docExists ? ($data[0]['document']['fields'] ?? []) : [];
      $postId = isset($fields['postId']) ? 'EXISTS' : 'MISSING';
      $title = isset($fields['title']) ? 'EXISTS' : 'MISSING';
      $id = $docExists && isset($data[0]['document']['name']) ? basename($data[0]['document']['name']) : 'NO ID';
      sendError('Kunde inte normalisera tutorial. Debug: id=' . $id . ', postId=' . $postId . ', title=' . $title . ', docName=' . $docName, 500);
    }
    
    echo json_encode(['success' => true, 'data' => $tutorial], JSON_UNESCAPED_UNICODE);
  } else {
    // Hämta tutorial direkt via id (dokumentnamn) med runQuery och __name__ filter
    $structuredQuery = [
      'from' => [['collectionId' => 'tutorials']],
      'where' => [
        'fieldFilter' => [
          'field' => ['fieldPath' => '__name__'],
          'op' => 'EQUAL',
          'value' => ['referenceValue' => 'projects/' . FIRESTORE_PROJECT_ID . '/databases/(default)/documents/tutorials/' . $id]
        ]
      ],
      'limit' => 1
    ];
    
    $data = queryFirestore($structuredQuery);
    
    // Firestore returnerar tom array [] om inget dokument hittas
    if (empty($data) || !isset($data[0])) {
      sendError('Tutorial hittades inte (inget resultat från Firestore)', 404);
    }
    
    // Kontrollera om dokumentet faktiskt finns (Firestore kan returnera tom array eller array med tomt objekt)
    if (!isset($data[0]['document'])) {
      sendError('Tutorial hittades inte (dokument saknas i resultat)', 404);
    }
    
    $tutorial = normalizeTutorial($data[0]);
    if (!$tutorial) {
      // Debug: logga vad som faktiskt finns i data[0]
      $docExists = isset($data[0]['document']);
      $docName = $docExists ? ($data[0]['document']['name'] ?? 'NO NAME') : 'NO DOCUMENT';
      $fields = $docExists ? ($data[0]['document']['fields'] ?? []) : [];
      $postId = isset($fields['postId']) ? 'EXISTS' : 'MISSING';
      $title = isset($fields['title']) ? 'EXISTS' : 'MISSING';
      $id = $docExists && isset($data[0]['document']['name']) ? basename($data[0]['document']['name']) : 'NO ID';
      sendError('Kunde inte normalisera tutorial. Debug: id=' . $id . ', postId=' . $postId . ', title=' . $title . ', docName=' . $docName, 500);
    }
    
    echo json_encode(['success' => true, 'data' => $tutorial], JSON_UNESCAPED_UNICODE);
  }
} catch (Exception $e) {
  sendError('Fel vid hämtning av tutorial: ' . $e->getMessage(), 500);
}

