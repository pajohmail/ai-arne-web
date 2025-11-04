<?php
// Gemensamma hjälpfunktioner för PHP API-endpoints

function sendCorsHeaders() {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $allowed = ['http://localhost:5173', 'https://ai-arne.se', 'https://www.ai-arne.se'];
  
  if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
  }
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Content-Type: application/json; charset=utf-8');
  
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
  }
}

function sendError($message, $code = 500) {
  http_response_code($code);
  echo json_encode(['error' => $message, 'success' => false]);
  exit;
}

function getField($fields, $key) {
  if (!isset($fields[$key])) return null;
  $v = $fields[$key];
  if (isset($v['stringValue'])) return $v['stringValue'];
  if (isset($v['timestampValue'])) return $v['timestampValue'];
  if (isset($v['integerValue'])) return $v['integerValue'];
  return null;
}

function normalizePost($row) {
  if (!isset($row['document'])) return null;
  $doc = $row['document'];
  $fields = $doc['fields'] ?? [];
  $name = $doc['name'] ?? '';
  $id = basename($name);
  
  $slug = getField($fields, 'slug');
  $title = getField($fields, 'title');
  
  if (!$id || !$slug || !$title) return null;
  
  return [
    'id' => $id,
    'slug' => $slug,
    'title' => $title,
    'excerpt' => getField($fields, 'excerpt'),
    'content' => getField($fields, 'content'),
    'provider' => getField($fields, 'provider'),
    'sourceUrl' => getField($fields, 'sourceUrl'),
    'linkedinUrn' => getField($fields, 'linkedinUrn'),
    'createdAt' => getField($fields, 'createdAt'),
    'updatedAt' => getField($fields, 'updatedAt'),
  ];
}

function normalizeNews($row) {
  if (!isset($row['document'])) return null;
  $doc = $row['document'];
  $fields = $doc['fields'] ?? [];
  $name = $doc['name'] ?? '';
  $id = basename($name);
  
  $slug = getField($fields, 'slug');
  $title = getField($fields, 'title');
  
  if (!$id || !$slug || !$title) return null;
  
  return [
    'id' => $id,
    'slug' => $slug,
    'title' => $title,
    'excerpt' => getField($fields, 'excerpt'),
    'content' => getField($fields, 'content'),
    'sourceUrl' => getField($fields, 'sourceUrl'),
    'source' => getField($fields, 'source'),
    'linkedinUrn' => getField($fields, 'linkedinUrn'),
    'createdAt' => getField($fields, 'createdAt'),
    'updatedAt' => getField($fields, 'updatedAt'),
  ];
}

function normalizeTutorial($row) {
  if (!isset($row['document'])) return null;
  $doc = $row['document'];
  $fields = $doc['fields'] ?? [];
  $name = $doc['name'] ?? '';
  $id = basename($name);
  
  $postId = getField($fields, 'postId');
  $title = getField($fields, 'title');
  
  if (!$id || !$postId || !$title) return null;
  
  return [
    'id' => $id,
    'postId' => $postId,
    'title' => $title,
    'content' => getField($fields, 'content'),
    'sourceUrl' => getField($fields, 'sourceUrl'),
    'createdAt' => getField($fields, 'createdAt'),
    'updatedAt' => getField($fields, 'updatedAt'),
  ];
}

function queryFirestore($structuredQuery) {
  if (!defined('FIRESTORE_PROJECT_ID') || !defined('FIRESTORE_API_KEY')) {
    sendError('Konfiguration saknas', 500);
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
    sendError('Nätverksfel: ' . $err, 500);
  }
  
  if ($http !== 200) {
    sendError('Firestore API fel: HTTP ' . $http, $http);
  }
  
  $data = json_decode($response, true);
  if (!is_array($data)) {
    sendError('Ogiltigt svar från Firestore', 500);
  }
  
  return $data;
}

