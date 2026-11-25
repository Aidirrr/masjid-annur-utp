// The viewer embeds IslamCan's Azan 1 recording from islamcan.com/audio/adhan/.
const worldAudio=(()=>{
    let ctx,noise,air,recording,call;
    let catClip,meowing=false;
    const sound=$('worldSound');
    function ready(){return sound.checked&&!document.hidden&&ctx?.state==='running';}
    function sync(){
        if(!sound.checked||document.hidden){
            if(call){call.stop();call=null;}
            if(ctx?.state==='running')ctx.suspend().catch(()=>{});
            return;
        }
        if(!ctx){
            const AudioEngine=window.AudioContext||window.webkitAudioContext;
            if(!AudioEngine)return;
            ctx=new AudioEngine();
            noise=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);
            const samples=noise.getChannelData(0);
            for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
            const breeze=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
            breeze.buffer=noise;breeze.loop=true;filter.type='lowpass';filter.frequency.value=720;
            air=ctx.createGain();air.gain.value=.045;
            breeze.connect(filter).connect(air).connect(ctx.destination);breeze.start();
        }
        if(ctx.state!=='running')ctx.resume().catch(()=>{});
    }
    document.addEventListener('pointerup',sync);
    document.addEventListener('keydown',sync);
    sound.onchange=sync;
    document.addEventListener('visibilitychange',()=>{if(ctx)sync();});
    function voice(type,pitches,length,gain,delay=0){
        if(!ready()||call)return;
        const start=ctx.currentTime+delay,osc=ctx.createOscillator(),volume=ctx.createGain();
        osc.type=type;
        pitches.forEach((pitch,i)=>osc.frequency.exponentialRampToValueAtTime(pitch,start+length*i/(pitches.length-1)));
        volume.gain.setValueAtTime(.0001,start);
        volume.gain.exponentialRampToValueAtTime(gain,start+length*.15);
        volume.gain.exponentialRampToValueAtTime(.0001,start+length);
        osc.connect(volume).connect(ctx.destination);osc.start(start);osc.stop(start+length);
    }
    setInterval(()=>{
        if(!ready()||Math.random()>.55)return;
        voice('sine',[2300,3400,2700],.16,.017);
        voice('sine',[2600,3600,3100],.12,.014,.22);
    },4200);
    return {
        ready,
        async meow(){
            sync();
            if(!ctx||!sound.checked||document.hidden||call||meowing)return;
            meowing=true;
            try{
                if(!catClip){
                    const bytes=Uint8Array.from(atob('__MEOW__'.split(',')[1]),c=>c.charCodeAt(0));
                    catClip=await ctx.decodeAudioData(bytes.buffer);
                }
                if(!ready()||call){meowing=false;return;}
                const cat=ctx.createBufferSource(),gain=ctx.createGain();
                cat.buffer=catClip;gain.gain.value=.46;
                cat.connect(gain).connect(ctx.destination);
                cat.onended=()=>{meowing=false;};
                cat.start();
            }catch{meowing=false;}
        },
        splash(){
            sync();
            for(let i=0;i<5;i++)voice('sine',[480+Math.random()*290,170],.10,.075,i*.055);
        },
        async athan(){
            if(!ready()||call)return false;
            if(!recording){
                const bytes=Uint8Array.from(atob('__ATHAN__'.split(',')[1]),c=>c.charCodeAt(0));
                recording=await ctx.decodeAudioData(bytes.buffer);
            }
            if(!ready())return false;
            call=ctx.createBufferSource();call.buffer=recording;
            const gain=ctx.createGain();gain.gain.value=.65;
            call.connect(gain).connect(ctx.destination);
            air.gain.value=.008;
            call.onended=()=>{call=null;air.gain.value=.045;};
            call.start();return true;
        }
    };
})();
