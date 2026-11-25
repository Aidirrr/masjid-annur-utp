// These panels are embedded in the standalone viewer by build.py.
const openCommunity = (() => {
    const mosque = 'https://e-masjid.perak.my/masjid/Xj3rYW';
    const rakanMasjid = 'https://rakan-masjid-website.vercel.app';
    const timetable = 'https://mufti.perak.gov.my/component/content/article/waktu-solat-2026?catid=2';
    const repo = 'https://github.com/Aidirrr/masjid-annur-utp';
    const zone = 'Asia/Kuala_Lumpur';
    const dateFormat = new Intl.DateTimeFormat('en-CA', {timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit'});
    const timeFormat = new Intl.DateTimeFormat('en-GB', {timeZone:zone, timeStyle:'medium'});
    const minuteFormat = new Intl.DateTimeFormat('en-GB', {timeZone:zone, timeStyle:'short'});
    const titles = {feed:'Sponsor fish food', donate:'Tabung Masjid', board:'Rakan Masjid UTP', founders:'Wall of contributors', ayah:'Ayah explainer', tour:'A walk through An-Nur'};

    const style = document.createElement('style');
    style.textContent = `
    #community-panel {inset:auto 1rem 1rem auto;margin:0;width:min(29rem,calc(100% - 2rem));max-height:85dvh;overflow:auto;background:#fcfbf5;color:#233d32;border:1px solid #aebfb1;border-radius:12px;padding:1.35rem;box-shadow:0 12px 55px #0d2d2640;line-height:1.55}
    #community-panel.giving {border:2px solid #d8bd80;border-top:8px solid #256554;border-radius:18px;box-shadow:0 5px 0 #183e34,0 12px 45px #102b3255}
    #community-panel.giving h2 {font:750 1.5rem/1.2 system-ui,sans-serif}
    .donation-qr {display:block;width:min(100%,240px);height:auto;margin:.8rem auto;background:white;padding:10px;border-radius:12px}
    #community-panel .save-qr {display:block;text-align:center;border-radius:10px;background:#24654f;color:white;font-weight:700;text-decoration:none;padding:.7rem;box-shadow:0 3px 0 #143a30}
    #community-panel .save-qr:active {transform:translateY(2px)}
    #community-panel::backdrop {background:#102a211c}
    #community-panel h2 {font:600 1.5rem/1.25 Georgia,serif;margin:0 4rem 1rem 0}
    #community-panel h3 {font-size:1rem;margin:1.1rem 0 .4rem}
    #community-panel p {margin:.55rem 0}
    #community-panel a {color:#265b48;text-underline-offset:3px}
    #community-panel button,#community-panel select {border:1px solid #aabaa9;border-radius:5px;background:#edf2e9;padding:.4rem .65rem;margin:.25rem .4rem .25rem 0}
    #community-panel .dismiss {position:absolute;right:.7rem;top:.65rem}
    #community-panel [lang=ar] {font:1.75rem/1.8 serif}
    #community-panel dl {display:grid;grid-template-columns:1fr auto;margin:.5rem 0}
    #community-panel dt,#community-panel dd {padding:.25rem 0;border-bottom:1px solid #dce2d7;margin:0}
    #community-panel time,#community-panel dd {font-variant-numeric:tabular-nums}
    `;
    document.head.append(style);
    const dialog = document.createElement('dialog');
    dialog.id = 'community-panel';
    dialog.setAttribute('aria-labelledby','community-title');
    dialog.innerHTML = '<button type="button" class="dismiss">Close</button><h2 id="community-title"></h2><div class="panel-body"></div>';
    document.getElementById('app').append(dialog);
    const body = dialog.querySelector('.panel-body');
    dialog.querySelector('.dismiss').onclick = () => dialog.close();
    let timer;
    dialog.addEventListener('close', () => clearInterval(timer));

    function add(tag, value, parent=body) {
        const el = document.createElement(tag);
        el.textContent = value;
        parent.append(el);
        return el;
    }
    function source(label, url, parent=body) {
        const link = add('a', label, parent);
        link.href = url;
        if (url.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        return link;
    }
    function action(label, fn, parent=body) {
        const button = add('button', label, parent);
        button.type = 'button';
        button.onclick = fn;
        return button;
    }
    async function fetchJSON(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(url, {signal:controller.signal, credentials:'omit'});
            if (!response.ok) throw new Error('Service unavailable');
            return await response.json();
        } finally {clearTimeout(timeout);}
    }
    function giving(feeding) {
        if (feeding) add('p','Ask the mosque committee about sponsoring fish food.');
        add('h3','Donate with DuitNow');
        const qr=add('img','');
        qr.className='donation-qr';
        qr.src='__MOSQUE_QR__';
        qr.alt='DuitNow QR for Jawatankuasa Masjid UTP';
        add('p','Before confirming in your banking app, check that the recipient is JAWATANKUASA MASJID UTP.');
        const download=source('Save DuitNow QR',qr.src);
        download.className='save-qr';
        download.download='Masjid-An-Nur-UTP-DuitNow.png';
        source('QR listed by SedekahJe','https://sedekah.je/mosque/masjid-an-nur-utp',add('p',''));
        if (feeding) action('Toss virtual food', () => {dialog.close();tossFood();}, add('p',''));
    }

    const prayerLabels = [['Subuh','fajr'],['Syuruk','syuruk'],['Zohor','dhuhr'],['Asar','asr'],['Maghrib','maghrib'],['Isyak','isha']];
    const months = new Map();
    function noticeboard() {
        add('p','Rakan Masjid UTP is a student Islamic club at Universiti Teknologi PETRONAS. Its members organise dakwah programmes, volunteer in the community and develop student leaders.');
        add('h3','Annual programmes');
        add('p','Kem Super Syabab helps children learn about prayer during the school holidays. Ramadhan Discovery brings people together for iftar, Quran study and bubur lambuk distribution.');
        source('Explore events and membership at Rakan Masjid UTP',rakanMasjid);
        add('h3','Prayer times');
        const label = add('label','Perak zone ');
        const choice = add('select','',label);
        for (const [id,name] of [['PRK05','5 · Seri Iskandar (campus)'],['PRK02','2 · Ipoh / Batu Gajah']]) add('option',name,choice).value=id;
        const clock = add('time','',add('p',''));
        const result = add('div','');
        result.setAttribute('aria-live','polite');
        source('Perak Mufti timetable',timetable);
        let activeRequest='';
        async function tick() {
            const now=new Date();
            const fields=Object.fromEntries(dateFormat.formatToParts(now).map(p=>[p.type,p.value]));
            const day=fields.year+'-'+fields.month+'-'+fields.day;
            clock.textContent=day+' · '+timeFormat.format(now)+' MYT';
            const region=choice.value, key=region+'-'+day;
            if (activeRequest===key) return;
            activeRequest=key;
            result.replaceChildren();
            const loading=add('p','Loading JAKIM times via Waktu Solat…',result);
            try {
                const monthKey=region+'-'+fields.year+'-'+fields.month;
                let data=months.get(monthKey);
                if (!data) {
                    data=await fetchJSON('https://api.waktusolat.app/v2/solat/'+region+'?year='+fields.year+'&month='+Number(fields.month));
                    if (data.zone!==region || Number(data.year)!==Number(fields.year) || Number(data.month_number)!==Number(fields.month) || !Array.isArray(data.prayers)) throw new Error('Unexpected timetable');
                    months.set(monthKey,data);
                }
                if (activeRequest!==key || !loading.isConnected) return;
                const row=data.prayers.find(p=>p.day===Number(fields.day));
                if (!row || prayerLabels.some(([,field])=>!Number.isFinite(row[field]))) throw new Error('Missing day');
                loading.remove();
                const list=add('dl','',result);
                for (const [name,field] of prayerLabels) {add('dt',name,list);add('dd',minuteFormat.format(row[field]*1000),list);}
            } catch {
                if (activeRequest!==key || !loading.isConnected) return;
                loading.textContent='Times are unavailable. Use the state timetable or retry.';
                action('Retry',()=>{activeRequest='';tick();},result);
            }
        }
        choice.onchange=tick;
        tick();
        timer=setInterval(tick,1000);
    }
    async function contributors() {
        add('p','Aidirrr founded this visualizer on 22 November 2026. The first release included the 3D model and offline viewer. The same day brought the recorded tour and Netlify configuration.');
        source('First project commit',repo+'/commit/ea5c0cc');
        add('h3','Project contributors');
        const status=add('p','Loading contributors from GitHub…');
        const roster=add('ul','');
        source('All contributors on GitHub',repo+'/graphs/contributors');
        try {
            for(let page=1;status.isConnected;page++) {
                const people=await fetchJSON('https://api.github.com/repos/Aidirrr/masjid-annur-utp/contributors?per_page=100&page='+page);
                if (!Array.isArray(people)) throw new Error('Missing list');
                for (const person of people) {
                    if(typeof person.login==='string') source(person.login,'https://github.com/'+encodeURIComponent(person.login),add('li','',roster));
                }
                if(people.length<100)break;
            }
            status.textContent=roster.childElementCount?'':'GitHub has no public contributor entries yet.';
        } catch {status.textContent='GitHub’s live list is unavailable. The founder and project history above are from the repository.';}
    }

    const lessons=[
        {
            name:'An-Nur · 24:35', ref:'24:35',
            ar:'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ ۖ الْمِصْبَاحُ فِي زُجَاجَةٍ ۖ الزُّجَاجَةُ كَأَنَّهَا كَوْكَبٌ دُرِّيٌّ يُوقَدُ مِن شَجَرَةٍ مُّبَارَكَةٍ زَيْتُونَةٍ لَّا شَرْقِيَّةٍ وَلَا غَرْبِيَّةٍ يَكَادُ زَيْتُهَا يُضِيءُ وَلَوْ لَمْ تَمْسَسْهُ نَارٌ ۚ نُّورٌ عَلَىٰ نُورٍ ۗ يَهْدِي اللَّهُ لِنُورِهِ مَن يَشَاءُ ۚ وَيَضْرِبُ اللَّهُ الْأَمْثَالَ لِلنَّاسِ ۗ وَاللَّهُ بِكُلِّ شَيْءٍ عَلِيمٌ',
            rumi:'Allāhu nūru s-samāwāti wa-l-arḍ. Mathalu nūrihi ka-mishkātin fīhā miṣbāḥ. Al-miṣbāḥu fī zujājah. Az-zujājatu ka-annahā kawkabun durriyyun yūqadu min shajaratin mubārakatin zaytūnatin lā sharqiyyatin wa-lā gharbiyyah. Yakādu zaytuhā yuḍīʾu wa-law lam tamsas-hu nār. Nūrun ʿalā nūr. Yahdī llāhu li-nūrihi man yashāʾ. Wa-yaḍribu llāhu l-amthāla li-n-nās. Wa-llāhu bi-kulli shayʾin ʿalīm.',
            en:'Allah is the Light of heaven and earth. His light is likened to a niche holding a lamp. The lamp is enclosed in glass that gleams like a brilliant star. It is kindled from a blessed olive tree, neither eastern nor western. Its oil almost shines of itself, before a flame has touched it. Light upon light. Allah leads whom He wills to His light. Allah offers people such comparisons, and He knows everything.',
            ms:'Allah ialah cahaya langit dan bumi. Perumpamaan cahaya-Nya seperti ceruk yang berisi pelita. Pelita itu di dalam kaca yang berkilau seperti bintang yang terang. Pelita itu dinyalakan dengan minyak daripada pokok zaitun yang diberkati, yang tidak di timur dan tidak di barat. Minyaknya hampir memancarkan cahaya meskipun belum disentuh api. Cahaya di atas cahaya. Allah membimbing sesiapa yang Dia kehendaki kepada cahaya-Nya. Allah memberikan perumpamaan kepada manusia dan Dia mengetahui segala sesuatu.',
            note:'Ibn Kathir recounts Ibn Abbas’s explanation of light as guidance. Look at the daylight entering below the dome as you reflect on the mosque’s name, An-Nur (“the Light”).'
        },
        {
            name:'Ayat al-Kursi · 2:255', ref:'2:255',
            ar:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
            rumi:'Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm. Lā taʾkhudhuhu sinatun wa-lā nawm. Lahu mā fī s-samāwāti wa-mā fī l-arḍ. Man dhā lladhī yashfaʿu ʿindahu illā bi-idhnih. Yaʿlamu mā bayna aydīhim wa-mā khalfahum. Wa-lā yuḥīṭūna bi-shayʾin min ʿilmihi illā bi-mā shāʾ. Wasiʿa kursiyyuhu s-samāwāti wa-l-arḍ. Wa-lā yaʾūduhu ḥifẓuhumā. Wa-huwa l-ʿaliyyu l-ʿaẓīm.',
            en:'Allah alone is God, ever living and sustaining all. He is untouched by drowsiness or sleep. Everything in heaven and on earth belongs to Him. Who could intercede in His presence without His leave? He knows what lies ahead of them and what is behind them. They comprehend only as much of His knowledge as He wills. His Kursi extends across heaven and earth. Guarding them both places no burden upon Him. He is the Most High, the Magnificent.',
            ms:'Allah, tiada tuhan selain Dia, Yang Maha Hidup lagi Yang Mengurus segala sesuatu. Dia tidak mengantuk dan tidak tidur. Segala yang ada di langit dan di bumi ialah milik-Nya. Siapakah yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya? Dia mengetahui apa yang di hadapan mereka dan apa yang di belakang mereka. Mereka hanya mengetahui daripada ilmu-Nya apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Memelihara kedua-duanya tidak membebankan-Nya. Dialah Yang Maha Tinggi lagi Maha Agung.',
            note:'The opening names Allah as the Living and the Sustainer. Facing the mihrab, worshippers share a direction of prayer. This reading invites reflection on the One to whom that prayer is offered.'
        }
    ];
    function ayah(index=0) {
        const label=add('label','Reading ');
        const select=add('select','',label);
        lessons.forEach((l,i)=>{add('option',l.name,select).value=i;});
        select.value=index;
        const reading=add('div','');
        function render(){
            reading.replaceChildren();
            const lesson=lessons[Number(select.value)];
            add('h3',lesson.name,reading);
            const arabic=add('p',lesson.ar,reading);arabic.dir='rtl';arabic.lang='ar';
            for(const [label,value] of [['Rumi',lesson.rumi],['English meaning',lesson.en],['Maksud dalam bahasa Melayu',lesson.ms],['Reflection',lesson.note]]) {
                add('h3',label,reading);
                const p=add('p',value,reading);
                if(value===lesson.ms)p.lang='ms';
            }
            source('Full ayah and tafsir', 'https://quran.com/'+lesson.ref+'/tafsirs/en-tafisr-ibn-kathir',reading);
        }
        select.onchange=render;render();
    }

    function tour() {
        const stops=[
            ['aerial','A university takes shape','UTP opened in 1997. Its Seri Iskandar campus grew around academic buildings designed by Foster + Partners. From above, trace the route between the shore and the mosque.','UTP campus history','https://www.utp.edu.my/about-us/about/'],
            ['waterside','The floating mosque','From the waterline, the terrace appears to hold the prayer hall just above the lake. Perak records construction beginning on 16 October 2003 and handover on 6 October 2005.','Perak mosque register',mosque],
            ['hall','Inside the prayer hall','Sultan Azlan Shah officially opened Masjid An-Nur on 14 July 2006. UTP describes the main hall and its covered prayer areas as serving the wider public as well as the university.','UTP mosque tour','https://www.utp.edu.my/Pages/The-University/360%20VR%20Tour/Masjid-An-Nur.aspx'],
            ['court','Beyond congregational prayer','During Ramadhan Discovery, Rakan Masjid UTP brings the community together for iftar and Quran study.','Rakan Masjid UTP programmes',rakanMasjid]
        ];
        let index=0;
        if(walking)setWalking(false);
        followFriday=false;
        function render() {
            const [view,title,copy,label,url]=stops[index];
            chooseView(view,false);
            body.replaceChildren();add('h3',title);add('p',copy);source(label,url);
            const nav=add('p','');
            action('Previous',()=>{index--;render();},nav).disabled=index===0;
            action(index===stops.length-1?'Finish tour':'Next stop',()=>{if(index===stops.length-1)dialog.close();else {index++;render();}},nav);
            add('small',(index+1)+' of '+stops.length,nav);
        }
        render();
    }
    return function open(key) {
        if (key==='kursi') key='ayah-kursi';
        const title=titles[key] || (key==='ayah-kursi' && titles.ayah);
        if (!title) return;
        clearInterval(timer);
        body.replaceChildren();dialog.querySelector('h2').textContent=title;
        dialog.classList.toggle('giving',key==='donate'||key==='feed');
        if(!dialog.open)dialog.showModal();
        dialog.scrollTop=0;
        if(key==='board')noticeboard();
        else if(key==='founders')contributors();
        else if(key==='tour')tour();
        else if(key.startsWith('ayah'))ayah(key==='ayah-kursi'?1:0);
        else giving(key==='feed');
    };
})();
