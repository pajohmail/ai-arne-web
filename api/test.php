<?php
// Diagnostikfil för att testa PHP-inställningar på one.com
// Ta bort denna fil efter testning av säkerhetsskäl

header('Content-Type: application/json; charset=utf-8');

$info = [
    'php_version' => PHP_VERSION,
    'curl_available' => function_exists('curl_init'),
    'json_available' => function_exists('json_encode'),
    'config_loaded' => defined('FIRESTORE_PROJECT_ID') && defined('FIRESTORE_API_KEY'),
    'project_id' => defined('FIRESTORE_PROJECT_ID') ? FIRESTORE_PROJECT_ID : 'NOT DEFINED',
    'api_key_defined' => defined('FIRESTORE_API_KEY'),
    'api_key_length' => defined('FIRESTORE_API_KEY') ? strlen(FIRESTORE_API_KEY) : 0,
];

// Testa att ladda config
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
    $info['config_file_exists'] = true;
    $info['config_loaded_after_require'] = defined('FIRESTORE_PROJECT_ID') && defined('FIRESTORE_API_KEY');
} else {
    $info['config_file_exists'] = false;
}

// Testa cURL om det är tillgängligt
if (function_exists('curl_init')) {
    $ch = curl_init('https://firestore.googleapis.com');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    
    $info['curl_test'] = [
        'http_code' => $http,
        'error' => $err ?: 'none',
        'can_connect' => $http > 0 || !$err,
    ];
} else {
    $info['curl_test'] = ['error' => 'cURL not available'];
}

echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

