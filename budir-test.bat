cmd /K supervisor --inspect -n error --watch %~dp0 -- %~dp0\budir-test.js %*