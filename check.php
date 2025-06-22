<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
if(!function_exists('str_starts_with')){function str_starts_with($h,$n){return substr($h,0,strlen($n))===$n;}}
