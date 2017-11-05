
exports.version = "1.0.0";


//funzione index di test
exports.testFunctionIndex = function(req, res) {
  res.end("hai chiamato l'index");
  console.log("è stata chiamata l'index");
}
