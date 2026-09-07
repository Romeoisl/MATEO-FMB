'use strict';
const http=require('http');
class HealthServer {
 constructor({app,logger,port=process.env.PORT||process.env.MATEO_HEALTH_PORT||0}){this.app=app;this.logger=logger;this.port=Number(port)||0;this.server=null;}
 start(){if(this.server)return this;this.server=http.createServer((req,res)=>{if(req.url==='/health'||req.url==='/status'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(this.app.status()));return;}res.writeHead(404,{'content-type':'application/json'});res.end(JSON.stringify({error:'not_found'}));});this.server.listen(this.port,()=>this.logger.info(`Health server listening on ${this.server.address().port}`));return this;}
 async stop(){if(!this.server)return;await new Promise(resolve=>this.server.close(resolve));this.server=null;}
}
module.exports=HealthServer;
