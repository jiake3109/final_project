const express = require('express');
const log = console.log;
const app = express();
var port = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://jiake3109:Jack12345678@cluster0.j71nv.mongodb.net/Artworks?retryWrites=true&w=majority";
const nodemailer = require('nodemailer');
const fs = require('fs');

// Configuring our data parsing
app.use(express.json());
app.use(express.static(__dirname));
var urlencodedParser = bodyParser.urlencoded({ extended: false })
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    XOAuth2: {
          user: "artilygallery@gmail.com",
          clientId: "793565051191-08q8qlkuhdvakkhrp8v5l2o2dlq8tgbv.apps.googleusercontent.com",
          clientSecret: "Mcb-9aSLTh1rTxIoGx2taCyk",
          refreshToken: "1//049yNXMomDfYsCgYIARAAGAQSNwF-L9IrHj220mGbioRl05XVvnRkwk9qKY9cWErPdwADB7YYmVJHWBUnr-eZOBc8apbWTtdPnRw"
    }
  }
});

var mailOptions = {
  from: 'artilygallery@gmail.com',
  to: 'jiake3109@icloud.com',
  subject: 'Sending Email using Node.js',
  generateTextFromHTML: true,
  text: 'Yo, whassup?'
};

app.get('/',function(req,res){
  fs.readFile('homepage.html',function(err,data){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
});

app.post('/view_artworks', urlencodedParser, function(req, res) {
    response = {
       genre:req.body.genre,
       medium:req.body.medium
    };
    fs.readFile('gallery_template.html',function(err,data){
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      MongoClient.connect(url, {useUnifiedTopology: true }, function(err,db){
          if (err) {return console.log(err); return;}
          var dbo = db.db("Artworks");
          var collection = dbo.collection("artwork_info");
          var query = {$or:[{"classification_titles":{$all:[response.genre]}},
                {"material_titles":{$all:[response.medium]}}]};
          collection.find(query).toArray(function(err, items){
              if (err) {
                  console.log("Error: " + err);
              }else{
                  var max_length = 12;
                  if (items.length < 12){
                      max_length = items.length;
                  }
                  var results = "	<div id='artworks' class='container'>";
                  for (i = 0; i < max_length; i++) {
                    if (i == 0 || i % 4 == 0) {
                        results += "<div class='row'>";
                    }
                    var index = Math.floor(Math.random() * items.length);
                    results +=
                      "<div class='col-sm-6 col-md-3'><div class='card h-100'><img src='" +
                      items[index].image_url + "' class='card-img-top img-thumbnail img-fluid' name='pic" + i +
                      "'/><div class='card-body'><h3 class='card-title font-weight-bold' name='title" + i +
                      "'/>"+ items[index].title +"</h3></div>" +"<ul class='list-group list-group-flush'>" +
                      "<li class='list-group-item font-weight-bold' name='artist" + i +
                      "'/>" + items[index].artist +"</li>" +"<li class='list-group-item' name='genre" + i +
                      "'/>" + "Credit from: " + items[index].credit +"</li>" + "<li class='list-group-item' name='medium" + i +
                      "'style='font-size:20px;'/>" + items[index].description + "</li>" + "</ul>" + "</div></div><br><br>";
                    if ((i + 1) % 4 == 0) {
                      results += "</div>";
                    }
                    if ((max_length != 12 )&&(i == max_length - 1)){
                      results += "</div>";
                    }
                  }
                  results += "</div>";
                  res.write(results);
                  res.write("<footer class='footer'><br>");
                  res.write("<p><b>ArtILY</b></p>");
                  res.write("<p>Harvard Square</p>");
                  res.write("<p>3 Brattle Street</p>");
                  res.write("<p>Cambridge, MA 02138</p>");
                  res.write("<a href='tel:8573218430'>(857)-321-8430</a><br>");
                  res.write("<a href= 'mailto:info@theslice.com'>info@theartily.com</a>");
                  res.write("</footer>");
                  db.close();
                  console.log(response);
                  res.end();
              }
          });
      });
  });
});

app.post('/process_post', urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   response = {
      name:req.body.sender_name,
      recipient:req.body.recipient_name,
      email:req.body.email,
      message:req.body.message,
      genre:req.body.genre,
      medium:req.body.medium,
      artwork_title:req.body.personalize_painting_text
   };
   transporter.sendMail(mailOptions, function(error, response) {
     if (error) {
       console.log(error);
     } else {
       console.log(response);
     }
     transporter.close();
   });
   fs.readFile('form_template.html',function(err,data){
     res.writeHead(200, {'Content-Type': 'text/html'});
     res.write(data);
     MongoClient.connect(url, {useUnifiedTopology: true }, function(err,db){
       if (err) {return console.log(err); return;}
       var dbo = db.db("Artworks");
       var collection = dbo.collection("artwork_info");
       if (req.body.pg_option == "generator"){
           var query = {"classification_titles":{$all:[response.genre]}};
           collection.find(query).toArray(function(err, items) {
             transporter.sendMail(mailOptions, function(error, info){
               if (error) {
                 console.log(error);
               } else {
                 console.log('Email sent: ' + info.response);
               }
             });
               if (err) {
                 console.log("Error: " + err);
               }
               else
               {
                 var index = Math.floor(Math.random() * items.length);
                 console.log("The artwork name is: " + items[index].title + ".<br>" + "The artwork's url is:" + items[index].image_url + ".");
                 res.write("<br><br><div style='text-align:center;'><img src='" + items[index].image_url + "' style='height:400px; width:300px;'></div><br>");
                 res.write("<div style='text-align:center;'>The artwork: <b>" + items[index].title + "</b> has been shared to <b>" + response['email'] + "</b><br><br></div>");
               }
               db.close();
               console.log(response);
               res.write("</body><footer class='footer'><br>");
               res.write("<p><b>ArtILY</b></p>");
               res.write("<p>Harvard Square</p>");
               res.write("<p>3 Brattle Street</p>");
               res.write("<p>Cambridge, MA 02138</p>");
               res.write("<a href='tel:8573218430'>(857)-321-8430</a><br>");
               res.write("<a href= 'mailto:info@theslice.com'>info@theartily.com</a>");
               res.write("</footer></html>");
               res.end();
            });
       }else{
           var query = {"title":response.artwork_title};
           collection.find(query).toArray(function(err, items) {
               if (err) {
                 console.log("Error: " + err);
               }
               else
               {
                 console.log("we found " + items.length + " items.");
                 if (items.length == 0){
                     res.write("<br><br><div style='text-align:center;'><h3>" + response.artwork_title +" is not found in our database. Please return to our form and enter the correct artwork title.</h3></div><br><br><br><br><br>");
                 }else{
                     var index = Math.floor(Math.random() * items.length);
                     console.log("The artwork name is: " + items[index].title + ".<br>" + "The artwork's url is:" + items[index].image_url + ".<br><br>");
                     res.write("<br><br><div style='text-align:center;'><img src='" + items[index].image_url + "' style='height:400px; width:300px;'></div><br>");
                     res.write("<div style='text-align:center;'>The artwork: <b>" + items[index].title + "</b> has been shared to <b>" + response['email'] + "</b><br><br></div>");
                 }
               }
               db.close();
               console.log(response);
               res.write("</body><footer class='footer'><br>");
               res.write("<p><b>ArtILY</b></p>");
               res.write("<p>Harvard Square</p>");
               res.write("<p>3 Brattle Street</p>");
               res.write("<p>Cambridge, MA 02138</p>");
               res.write("<a href='tel:8573218430'>(857)-321-8430</a><br>");
               res.write("<a href= 'mailto:info@theslice.com'>info@theartily.com</a>");
               res.write("</footer></html>");
               res.end();
            });
       }
     });
   });
});

app.listen(port, () => log('Server is starting on PORT,', 8080));
