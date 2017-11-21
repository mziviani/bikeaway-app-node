var express = require("express");
var ba = require("./bikeaway-handlers/base");
var methodOverride = require('method-override');
var mongoClient = require('mongodb').MongoClient;
var async = require("async");

var app = express();

//imposto lengine di ejs per template
app.set("view engine", "ejs");

//connesione al db
var url = 'mongodb://localhost:27017/Bikeaway';
var baDB;
mongoClient.connect(url, function(err, db) {
  if (err) {
      console.log("Non riesco a connetermi al database: "+err);
      return;
    };
  baDB=db
});


//percorso statico per caricare i file dei template
app.use(express.static(__dirname + "/../template"));

//override per rendere compatibile CRUD con i browser più vecchi per chiamate ajax
//pag 131
app.use("/private/api/json/:slag_percorso", methodOverride());


//MIDDLEWARE **********************************************************************************
//example middelware
/*app.use(function (req, res, next) {
  console.log('Time:', Date.now());
  next();
});
//middleware su url
app.use('/user/:id', function (req, res, next) {
  console.log('Request Type:', req.method);
  next();
});*/

//middleware per memorizzare la ricerca !!!
// middleware app o router ???


//middleware con doppia funzione utile per 404
/*app.get('/user/:id', function (req, res, next) {
  // if the user ID is 0, skip to the next route
  if (req.params.id == 0) next('route');
  // otherwise pass the control to the next middleware function in this stack
  else next(); //
}, function (req, res, next) {
  // render a regular page
  res.render('regular');
});*/
//MIDDLEWARE **********************************************************************************








//non trova la path -> output template html
app.get("/404", function(req,res) {
    res.status(404);
    res.render(__dirname + "/../template/404", {
        title:  "Ops pagina non trovata | " ,
        description: "meta descrizione categoria",
        code: "404"
    } )
})

app.get("/500", function(req,res) {
    res.status(500);
  /*  res.render(__dirname + "/../template/404", {
        title:  "Ops pagina non trovata | " ,
        description: "meta descrizione categoria",
        code: "404"
    } )*/
    res.end("ERRORE 500");
})

//cerca
app.get("/cerca", function(req,res) {
  res.render(__dirname + "/../template/ricerca", {
      title:  "Rircerca | " ,
      description: "meta descrizione categoria"
  } )
})

//categoria -> output template html
app.get("/:slag_category",function(req,res) {

    var idCategoria = req.params.slag_category;

    async.series([
        function(callback) {
          baDB.collection('category').aggregate([
                                                {
                                                    $match: {
                                                               _id:idCategoria
                                                            }
                                                },
                                                { $lookup: {
                                                            from: "percorsi",
                                                            localField: "_id",
                                                            foreignField: "scheda._idcategory",
                                                            as: "percorsi"
                                                            }
                                                },
                                                {
                                                   $project: {
                                                               "title":1,
                                                               "percorsi": {
                                                                            $filter: {
                                                                                        input:"$percorsi",
                                                                                        as: "percorsi",
                                                                                        cond: {
                                                                                                    $eq: ["$$percorsi.scheda.publish", true]
                                                                                                }
                                                                                      }


                                                                           }
                                                              }
                                                },
                                                 { $unwind:"$percorsi" },
                                                          { $sort: {
                                                                    "percorsi.scheda.title":1
                                                                    }
                                                          },
                                                          { $group: {
                                                                    _id:"$_id",
                                                                    title: {$first:"$title"},
                                                                    percorsi: {$push: "$percorsi"}
                                                                    }
                                                          }
                                              ]).toArray(function(err,resPercorsi) {
                                                                                    if(err) {
                                                                                      callback(err);
                                                                                    }

                                                                                    //controllo il numero di percorsi -> 0 redirect 404
                                                                                    if (resPercorsi.length==0) {
                                                                                      res.redirect("/404");
                                                                                      return;
                                                                                    }

                                                                                    callback(null, resPercorsi);
                                                                                  })
        },
        function(callback) {
          baDB.collection("category").aggregate([
                                                 {
                                                   $match:  {
                                                              publish: true
                                                            }
                                                  },
                                                  { $lookup: {
                                                                from: "percorsi",
                                                                localField: "_id",
                                                                foreignField: "scheda._idcategory",
                                                                as: "percorsi"
                                                              }
                                                  },
                                                  {  $project: {  "title": 1,
                                                                  "image": 1,
                                                                  "order":1,
                                                                  "percorsi": {
                                                                                $filter: {
                                                                                           input: "$percorsi",
                                                                                           as: "percorsi",
                                                                                           cond: {
                                                                                                  "$eq": ["$$percorsi.scheda.publish", true]
                                                                                                 }
                                                                                          }
                                                                              }
                                                                  }
                                                   },
                                                    { $unwind:"$percorsi" },
                                                    { $sort: {
                                                              "percorsi.scheda.publish_date": -1
                                                              }
                                                    },
                                                    { $group: {
                                                              _id:"$_id",
                                                              title: {$first:"$title"},
                                                              image: {$first:"$image"},
                                                              order: {$first: "$order"},
                                                              percorsi: {$push: "$percorsi"}
                                                              }
                                                    },{
                                                       $sort: {
                                                                "order": 1
                                                              }
                                                       },
                                                    {
                                                      $project: {
                                                                  "_id":1,
                                                                  "title":1,

                                                                 }

                                                     }
                                                ]).toArray(function(err, resCategory) {
                                                    if(err) {
                                                        callback(err)
                                                    }

                                                    if (resCategory.length==0) {
                                                      resCategory = undefined;
                                                    }

                                                    callback(null, resCategory)

                                                })
        }
      ], function(err,result) {
        if(err) {
          console.log("errore in index mongodb find: " + err);
          //redirect errore server 500
          res.redirect("/500");
          return;
        }

        res.render(__dirname + "/../template/category", {
            title: req.params.slag_category + " | " ,
            description: "meta descrizione categoria",
            percorsiObj: result[0],
            categoryObj: result[1]
        } )
      }
    )
})

//percorso -> output template html
app.get("/:slag_category/:slag_percorso",function(req,res) {
  res.render(__dirname + "/../template/percorso", {
      title: req.params.slag_percorso + " | " + req.params.slag_category + " | " ,
      description: "meta descrizione categoria"
  } )
})



//INDEX
//app.get("/", ba.testFunctionIndex);
app.get("/", function(req,res) {
  async.waterfall([
        function(callback) {
          baDB.collection('category').aggregate([
                                                   {
                                                     $match:  {
                                                                publish: true
                                                              }
                                                    },
                                                    { $lookup: {
                                                                  from: "percorsi",
                                                                  localField: "_id",
                                                                  foreignField: "scheda._idcategory",
                                                                  as: "percorsi"
                                                                }
                                                    },
                                                    {  $project: {  "title": 1,
                                                                    "image": 1,
                                                                    "order":1,
                                                                    "percorsi": {
                                                                                  $filter: {
                                                                                             input: "$percorsi",
                                                                                             as: "percorsi",
                                                                                             cond: {
                                                                                                    "$eq": ["$$percorsi.scheda.publish", true]
                                                                                                   }
                                                                                            }
                                                                                }
                                                                    }
                                                     },
                                                      { $unwind:"$percorsi" },
                                                      { $sort: {
                                                                "percorsi.scheda.publish_date": -1
                                                                }
                                                      },
                                                      { $group: {
                                                                _id:"$_id",
                                                                title: {$first:"$title"},
                                                                image: {$first:"$image"},
                                                                order: {$first: "$order"},
                                                                percorsi: {$push: "$percorsi"}
                                                                }
                                                      },
                                                      {  $project: {
                                                                "title": 1,
                                                                "image": 1,
                                                                "order":1,
                                                                "percorsi": {
                                                                          $slice: ["$percorsi", 2]
                                                                            },
                                                                      }
                                                      }, {
                                                          $sort: {
                                                                  "order": 1
                                                                }
                                                         }
                                                       ]).toArray(function(err,category) {
                                                         if(err) {
                                                           callback(err)
                                                         }
                                                          callback(null, category)
                                                        })
        },
        function(category, callback) {

          var idEscludere = []
            category.forEach(function(catObj) {
                catObj['percorsi'].forEach(function percorsi(objPercorso) {
                    idEscludere.push(objPercorso._id);
                })

            })

            callback(null, category, idEscludere)
        }
      ], function (err, category, idEsclusi) {
              console.log(category,idEsclusi);
              if (err) {
                res.redirect("/500");
                return;
              }

               res.render(__dirname + "/../template/index", {
                                                            title: null,
                                                            description: "meta descrizione",
                                                             //highlightObj: highlightObj,
                                                             categoryObj: category
                                                           })
         })


});

//commenti -> output JSON
// variabili get per recuperare la pagina ?page=n {1,2,3,n}
// dimensione fissa
// o paginazione via JS?
/*app.use("/private/api/json/:slag_percorso", function(res,req,next) {
  console.log("json")
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next()
})*/


app.get("/private/api/json/:slag_percorso/", function(req,res) {
  res.end("carica commenti di " + req.params.slag_percorso);
})


//commenti -> pubblicazione commento -> return true | false
app.put("/private/api/json/:slag_percorso/", function(req,res) {
    res.end("pubblica commento per il percorso " + req.param.slag_percorso )
})

//in caso di URI non definiti -> redirect con errore 404
app.get("*", function(req,res) {
    res.redirect("/404");
})



//to do
// -> cron job per avvisi
// ralizzare la parte di avvisi
// -> parte amministrativa ? (no)
//realizzare pagine statiche
// realizzare redirect /505
// api mailchimp
// api akismet
// sistemare filtering con javascript


app.listen(8080);
