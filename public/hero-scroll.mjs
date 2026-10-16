const scene=document.querySelector('#hero-scroll');
const video=document.querySelector('#hero-video');
const media=document.querySelector('.hero-media');
const toggle=document.querySelector('#hero-motion');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let enabled=!reduced.matches,ready=false,failed=false,frame=0,target=0,loaded=false;
video.muted=true;video.defaultMuted=true;
function unlocked(){return !document.body.classList.contains('age-pending')}
function paint(){
 frame=0;if(!enabled||!ready||!unlocked()||document.hidden)return;
 const bounds=scene.getBoundingClientRect(),travel=scene.querySelector('.hero').offsetHeight*.8;
 const progress=Math.max(0,Math.min(1,-bounds.top/Math.max(1,travel)));
 target=progress*Math.max(0,video.duration-1/24);
 // Keep only the latest position; avoid a queue of overlapping decoder seeks.
 if(!video.seeking&&Math.abs(video.currentTime-target)>1/48)video.currentTime=target;
}
function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
function update(){
 scene.classList.toggle('motion-active',(enabled||loaded)&&!failed);
 toggle.hidden=failed;toggle.setAttribute('aria-pressed',String(enabled));
 toggle.textContent=enabled?'Ⅱ Pause animation':'▶ Animate on scroll';toggle.setAttribute('aria-label',enabled?'Pause scroll animation':'Enable scroll animation');
 if(enabled&&unlocked()&&!loaded&&!failed){loaded=true;video.src=video.dataset.src;video.preload='auto';video.load()}
 schedule();
}
video.addEventListener('loadeddata',()=>{ready=Number.isFinite(video.duration)&&video.duration>0;if(ready){media.classList.add('video-ready');schedule()}});
video.addEventListener('seeked',()=>{if(enabled&&Math.abs(video.currentTime-target)>1/48)schedule()});
video.addEventListener('error',()=>{failed=true;ready=false;media.classList.remove('video-ready');update()});
// No autoplay or play() call: scrolling alone chooses a frame. The delivered file has no audio track.
video.addEventListener('play',()=>video.pause());
toggle.addEventListener('click',()=>{enabled=!enabled;update()});
reduced.addEventListener('change',()=>{enabled=!reduced.matches;update()});
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
document.addEventListener('visibilitychange',schedule);
new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
update();

