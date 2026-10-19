class CifraAutoScroll{
 constructor({frame=fn=>requestAnimationFrame(fn),cancel=id=>cancelAnimationFrame(id),reduced=()=>false,onState=()=>{}}={}){this.frame=frame;this.cancel=cancel;this.reduced=reduced;this.onState=onState;this.speed=24;this.running=false;this.id=null;this.element=null;this.previous=null;this.tick=this.tick.bind(this);}
 setSpeed(value){const speed=Number(value);if(Number.isFinite(speed))this.speed=Math.max(5,Math.min(80,speed));}
 start(element){if(!element||this.reduced()||element.scrollHeight<=element.clientHeight)return false;this.stop();this.element=element;this.running=true;this.previous=null;this.id=this.frame(this.tick);this.onState(true);return true;}
 tick(time){if(!this.running)return;if(this.reduced()){this.stop();return;}if(this.previous!==null){const seconds=Math.max(0,Math.min(.08,(time-this.previous)/1000));this.element.scrollTop+=this.speed*seconds;}this.previous=time;if(this.element.scrollTop>=this.element.scrollHeight-this.element.clientHeight-1){this.stop();return;}this.id=this.frame(this.tick);}
 stop(){if(this.id!==null)this.cancel(this.id);this.id=null;this.running=false;this.previous=null;this.onState(false);}
}
