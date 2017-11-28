var express = require("express");
var ba = require("./bikeaway-handlers/base");
var methodOverride = require('method-override');
var mongoClient = require('mongodb').MongoClient;
var async = require("async");
var crypto = require("crypto");
var cookieParser = require('cookie-parser');


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

//set cookieParser
app.use(cookieParser());

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
    res.end("ERRORE 500");
})

//cerca
app.get("/cerca", function(req,res) {


  //1 pulire la ricerca
  var parolaRicercata = req.query.q;
  //modulo personalizzato per ricavare le keyword da una stringa di ricerca
  var searchKeyword = ba.keyWordGenerator(parolaRicercata);

  //controllo se esiste un cookie per identificare l'utente
  // se non esiste genero un hash per identificare l'utente
  var idCookie = req.cookies.sessionid;

  if (idCookie == undefined) {
    crypto.randomBytes(48, function(err, buffer) {
      var idCookie = buffer.toString('hex');
      res.cookie("sessionid", idCookie, { expires: new Date(253402300000000)});
    });
  }

  //doppia ricerca
  //prima ricerca rigida in caso 0 result
  //seconda ricerca lasca
  async.waterfall([
        function(callback) {
          baDB.collection('percorsi').aggregate([
                                                    {
                                                            $match: {
                                                                      'scheda.publish':true,
                                                                      'scheda.tags': { $all: searchKeyword }
                                                                    }
                                                     },
                                                     {
                                                         $lookup: {
                                                                    from:"category",
                                                                    localField: "scheda._idcategory",
                                                                    foreignField: "_id",
                                                                    as: "categoria"

                                                             }

                                                      }

                                                  ]).toArray(function(err,result) {
                                                    if(err) {
                                                      callback(err)
                                                      return;
                                                    }

                                                    callback(null, result)


                                                  })

        },
        function(result,callback) {
          if(result.length==0) {
            baDB.collection('percorsi').aggregate([
                                                          {
                                                                  $match: {

                                                                             $text: { $search: parolaRicercata,
                                                                                      $caseSensitive: false},
                                                                             'scheda.publish':true,
                                                                          }
                                                           },
                                                           {
                                                               $lookup: {
                                                                          from:"category",
                                                                          localField: "scheda._idcategory",
                                                                          foreignField: "_id",
                                                                          as: "categoria"

                                                                   }

                                                            }


                                                  ]).toArray(
                                                    function(err,result) {
                                                    if(err) {
                                                      callback(err)
                                                      return;
                                                    }

                                                    callback(null, result)

                                                  })



          } else {
            callback(null,result)
          }

        }, function(result, callback) {

          //inserisco nel db la ricerca + hash utente
          baDB.collection("historySearch").insert(
                            {_idUtente: idCookie,
                              data: new Date(Date.now()),
                              ricerca: parolaRicercata,
                              keyword: searchKeyword
                            })

          callback(null,result)

        }],
        function(err, result) {
          if(err) {
            console.log("errore nella ricerca: " + err);
            res.redirect("/505");
            return;
          }

          if(result.length==0) {
            result = undefined;
          }


          res.render(__dirname + "/../template/ricerca", {
              title:  "Ricerca | "+parolaRicercata,
              description: "meta descrizione categoria",
              query: parolaRicercata,
              serp: result
          } )
        }


  )

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
                                                                                      return
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
                                                        return
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
  var idPercorso = req.params.slag_percorso;
  var idCategory = req.params.slag_category;
  var cerca = false;

  //controllo se deriva dal cerca o dalla categoria
  if (req.query.type=="search") {
    cerca = true;
  }

  baDB.collection("percorsi").aggregate([
                                        {
                                                $match: {
                                                            $and: [
                                                                    {_id: idPercorso},
                                                                    {'scheda._idcategory':idCategory},
                                                                    {'scheda.publish': true}
                                                            ]
                                                        }
                                         },
                                         {
                                             $lookup: {
                                                        from:"category",
                                                        localField: "scheda._idcategory",
                                                        foreignField: "_id",
                                                        as: "categoria"

                                                 }

                                          },
                                          { $limit : 1 }
                            ]).toArray(function(err, resPercorso) {

                              if(err) {
                                  res.redirect("/505");
                                  return;
                              }

                              if (resPercorso.length==0) {
                                  res.redirect("/404");
                                  return;
                              }

                              //Incremento di 1 le visite al percorso
                              baDB.collection("percorsi").update(
                                                {_id: resPercorso[0]['_id']},
                                                 {$inc: { 'scheda.view': 1}}
                                                )

                              res.render(__dirname + "/../template/percorso", {
                                  title: resPercorso[0]['scheda'].title + " | ",
                                  description: "meta descrizione categoria",
                                  percorsoObj: resPercorso,
                                  search: cerca
                              } )

                          })




})



//INDEX
app.get("/", function(req,res) {
  //carico id utente
  var idCookie = req.cookies.sessionid;

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
                                                           return
                                                         }
                                                          callback(null, category)
                                                        })
        },
        function(category, callback) {
          //id da escludere per gli hightlight

          var idEscludere = []
            category.forEach(function(catObj) {
                catObj['percorsi'].forEach(function percorsi(objPercorso) {
                    idEscludere.push(objPercorso._id);
                })

            })

            callback(null, category, idEscludere)
        },
        function (category, idEscludere, callback) {
          //1. recupero le keyword dell'utente


          //se l'utente non ha un id non ritorno le keyword utente
          //altrimenti richiamo le keyword da db
          if (idCookie==null) {
            //non ci sono keyword utente
            callback(null,null,idEscludere,category)
            return
          }

          //1. carico le keyword più utilizzate dall'_idUtente
          baDB.collection('historySearch').aggregate([

                {
                   $group: {
                                _id: '$_idUtente',
                                keyword: {$push: '$keyword' },
                          }

                },
                {
                    $match: { _id: idCookie}
                 },
                 { $unwind: "$keyword" },
                 { $unwind: "$keyword" },
                 { $sortByCount: "$keyword" },
                 { $match: {
                            'count': {
                                        $not: {
                                                $eq: 1
                                               }
                                      }
                            }

                 },
                 {$limit:5}
            ]).toArray(function(err,userKeyword) {

                if(err || userKeyword.length==0) {
                  //non ci sono keyword utente
                  callback(null,null,idEscludere,category)
                  return
                }

                //estrapolo le keyword
                var userKeywordArray = []
                  userKeyword.forEach(function(keyObj) {
                          userKeywordArray.push(keyObj['_id']);
                  })

                //ritorno le k eyword utente
                callback(null,userKeywordArray,idEscludere,category)
            })


        },
        function(userKeyword, idEscludere,category,callback) {
          //2. carico i percorsi in funzione delle keyword utente

          //controllo se esistono keyword utente
          if (userKeyword == null) {
            //err, risultato percorsi, idEscludere, category
            callback(null,null, idEscludere, category)
            return
          }

          //altrimenti richiamo i percorsi utente escludendo gli id già visualizzati
            baDB.collection('percorsi').aggregate([
                                                              {
                                                                      $match: {
                                                                                'scheda.publish':true,
                                                                                'scheda.tags': { $in: userKeyword },
                                                                                '_id': {$nin: idEscludere}
                                                                              }


                                                               },

                                                                  {
                                                                   $lookup: {
                                                                              from:"category",
                                                                              localField: "scheda._idcategory",
                                                                              foreignField: "_id",
                                                                              as: "categoria"

                                                                       }

                                                                },
                                                                { $limit : 3}

                                                  ]).toArray(function(err,hightlight) {

                                                    //se errore o se ritorna 0
                                                    if (err || hightlight.length == 0 ) {
                                                      //err, risultato percorsi, idEscludere, category
                                                      callback(null,null, idEscludere, category)
                                                      return
                                                    }


                                                    //aggiorno gli id da idEscludere
                                                    hightlight.forEach(function percorsiObj(idEx) {
                                                        idEscludere.push(idEx['_id'])
                                                    })



                                                    callback(null,hightlight, idEscludere,category)
                                                  })




        },
        function (hightlight,idEsludere,category, callback) {
          //3. controllo che gli hightlight tornati sono 3
          // 3-> exit <3 ricarico le 10  keyword più utilizzate da tutti gli utenti
          if (hightlight!=null) {
              if(hightlight.length==3) {
                callback(null,null,hightlight,idEsludere,category)
                return
              }
          }

          //aggiorno la tabella delle keyword più usate dagli utenti
          baDB.collection('historySearch').mapReduce(function() {
                                                                  this['keyword'].forEach(function(parola){ emit(parola,1)})
                                                                  },
                                                      function(keyword, count) {
                                                                  var i = 0;
                                                                  count.forEach(function(v) { i+=v});
                                                                  return i
                                                                  },

                                                      {out: "usedKeyword"}
                                                     );

          //richiamo le 10 keyword più ricercate da tutti gli utenti
            baDB.collection('usedKeyword').find({value: {$ne: 1}})
                                          .sort({value:-1})
                                          .limit(10)
                                          .toArray(function(err,allUserKeyword) {
                                            if (err || allUserKeyword.length==0) {
                                                //nessuna keyword per tutti gli utenti passo null
                                                //err, allUserkeyword,hightlight,idEscludere,category
                                                callback(null,null,hightlight,idEsludere,category)
                                                return
                                            }
                                                //genero l'array
                                                var AllKeywordArray = []
                                                allUserKeyword.forEach(function percorsiObj(id) {
                                                    AllKeywordArray.push(id['_id'])
                                                })

                                                callback(null,AllKeywordArray,hightlight,idEsludere,category)
                                          })

        },
        function(allUserKeyword, hightlight,idEscludere,category,callback) {
          var limiteQuery = 3
          //4. controllo che gli hightlight tornati sono 3 in caso carico gli altri percorsi
          // 3-> exit <3 chiamare percorsi con keyword più ricercate da tutti gli utenti
          if (hightlight != null) {
              if(hightlight.length==3 || allUserKeyword.length==0) {
                callback(null,hightlight,idEscludere,category)
                return
              } else {
                limiteQuery = 3-hightlight.length
              }
          }
          //manca l'esclusione degli id
          //carico i percorsi con le keyword
          baDB.collection('percorsi').aggregate([
                                                  {
                                                          $match: {
                                                                    'scheda.publish':true,
                                                                    'scheda.tags': { $in: allUserKeyword },
                                                                    '_id': { $nin: idEscludere}

                                                                  }
                                                   },
                                                   {
                                                       $lookup: {
                                                                  from:"category",
                                                                  localField: "scheda._idcategory",
                                                                  foreignField: "_id",
                                                                  as: "categoria"

                                                           }

                                                    },
                                                    { $limit : limiteQuery }

                                      ]).toArray(function(err,result) {
                                          if (err || result.length==0) {
                                            callback(null,hightlight,idEscludere,category)
                                            return
                                          }

                                          //aggiungo il risultato a hightlith
                                          if (hightlight != null) {
                                            hightlight.push(result)
                                          } else {
                                            hightlight = result
                                          }

                                          //aggiorno la lista di id da escludere in caso nella fase successiva
                                          result.forEach(function percorsiObj(idEx) {
                                              idEscludere.push(idEx['_id'])
                                          })


                                          callback(null,hightlight,idEscludere,category)

                                      })
        },
        function(hightlight,idEscludere,category,callback) {
          //5. carico i percorsi più visualizzati
          // se highlight = 3 exit altrimenti carico quelli più visti
          var limiteQuery = 3
          //4. controllo che gli hightlight tornati sono 3 in caso carico gli altri percorsi
          // 3-> exit <3 chiamare percorsi con keyword più ricercate da tutti gli utenti
          if (hightlight!=null) {
            if(hightlight.length==3) {
              callback(null,hightlight,category)
              return
            } else {
              limiteQuery = 3-hightlight.length
            }
          }
          //carico i percorsi più visualizzati
          baDB.collection('percorsi').aggregate([
                                                  {
                                                          $match: {
                                                                    'scheda.publish':true,
                                                                    '_id': { $nin: idEscludere}

                                                                  }
                                                   },
                                                   {
                                                        $sort: { 'scheda.view':-1}
                                                    },
                                                   {
                                                       $lookup: {
                                                                  from:"category",
                                                                  localField: "scheda._idcategory",
                                                                  foreignField: "_id",
                                                                  as: "categoria"

                                                           }

                                                    },
                                                    { $limit : limiteQuery }

                                      ]).toArray(function(err,result) {

                                          if (err || result.length==0) {
                                          //  console.log("errore");
                                            callback(null,hightlight,category);
                                            return
                                          }

                                          if (result.length>0 && hightlight != null) {
                                            //console.log("result > 0 ma non nullo");

                                            hightlight.push(result)
                                          } else if (result.length>0 && hightlight == null) {

                                            //console.log("hightlight = result");
                                            hightlight = result
                                          }


                                          callback(null,hightlight,category)
                                      })

        },
        function(hightlight, category, callback) {
          //carico la storia della ricerca utente
          if (hightlight != null) {
            if (hightlight.length<3) {
              hightlight = null
            }
          }


          if (idCookie==null) {
            //non ci sono keyword utente
            callback(null,hightlight,category,null)
            return
          }
          //carico la ricerca utente
          baDB.collection('historySearch').find({'_idUtente':idCookie}, {'ricerca':1})
                                          .sort({'data':-1})
                                          .limit(3)
                                          .toArray(function(err,searchStory) {
                                              if (err) {
                                                  callback(null,hightlight,category,null);
                                                  return
                                              }
                                              callback(null,hightlight,category,searchStory);
                                          })
        }
      ], function (err, hightlight, category, searchStory) {
              if (err) {
                res.redirect("/500");
                return;
              }

               res.render(__dirname + "/../template/index", {
                                                            title: null,
                                                            description: "meta descrizione",
                                                             highlightObj: hightlight,
                                                             searchStoryObj: searchStory,
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
//realizzare pagine statiche (contatti, help center ecc...)
// realizzare redirect /505
// api mailchimp
// api akismet
// sistemare filtering con javascript
//api


app.listen(8080);
