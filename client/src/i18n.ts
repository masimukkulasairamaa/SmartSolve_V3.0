export type UiLanguage = 'en' | 'hi' | 'sat' | 'nnp';

type Dict = Record<string,string>;
const DICT: Record<Exclude<UiLanguage,'en'>, Dict> = {
  hi: {
    'Live issues':'लाइव समस्याएँ','Report issue':'समस्या दर्ज करें','My reports':'मेरी रिपोर्ट','AI opportunities':'AI अवसर','Projects':'परियोजनाएँ','Organization':'संस्था','Command center':'कमांड सेंटर','Notifications':'सूचनाएँ','Project channel':'प्रोजेक्ट चैनल','Contact requests':'संपर्क अनुरोध','Language':'भाषा','SOS':'SOS','Sign in':'साइन इन','Create account':'खाता बनाएँ','Citizen':'नागरिक','Student':'छात्र','Faculty':'फैकल्टी','Industry Member':'उद्योग सदस्य','Full name':'पूरा नाम','Email':'ईमेल','Password':'पासवर्ड','Account type':'खाता प्रकार','English':'अंग्रेज़ी','Hindi':'हिंदी','Santali':'संताली','Nagpuri':'नागपुरी','Report an issue':'समस्या दर्ज करें','Issue title':'समस्या का शीर्षक','What is happening?':'क्या हो रहा है?','District':'जिला','Block':'प्रखंड','Category':'श्रेणी','Urgency':'तात्कालिकता','Location':'स्थान','Location / landmark':'स्थान / लैंडमार्क','Location or landmark':'स्थान या लैंडमार्क','Support needed':'आवश्यक सहायता','Current status':'वर्तमान स्थिति','Evidence':'प्रमाण','Submit issue':'समस्या भेजें','Report problem':'समस्या दर्ज करें','Report a problem':'समस्या दर्ज करें','Add supporting evidence':'सहायक प्रमाण जोड़ें','Choose photos, videos or documents':'फोटो, वीडियो या दस्तावेज़ चुनें','Allow a project team to request my contact details':'प्रोजेक्ट टीम को मेरी संपर्क जानकारी का अनुरोध करने की अनुमति दें','Best-fit institutions':'सबसे उपयुक्त संस्थाएँ','Recommended partners':'अनुशंसित साझेदार','Refresh matches':'मैचिंग रीफ्रेश करें','Take this challenge':'यह चुनौती लें','Take up this problem':'यह समस्या अपनाएँ','Overview':'अवलोकन','Partners':'साझेदार','Hide':'छिपाएँ','Restore':'पुनर्स्थापित करें','Progress':'प्रगति','Reporter':'रिपोर्टर','Reported':'रिपोर्ट की गई','Impact':'प्रभाव','Verify partner':'साझेदार सत्यापित करें','Revoke verification':'सत्यापन हटाएँ','Add institution':'संस्था जोड़ें','Create administrator':'प्रशासक बनाएँ','Government accounts':'सरकारी खाते','Administrator accounts':'प्रशासक खाते','Save':'सहेजें','Create':'बनाएँ','Active':'सक्रिय','Inactive':'निष्क्रिय','College':'कॉलेज','University':'विश्वविद्यालय','Industry':'उद्योग','Description':'विवरण','Address':'पता','Accepted problem areas':'स्वीकृत समस्या क्षेत्र','Expertise':'विशेषज्ञता','Accepted work types':'स्वीकृत कार्य प्रकार','Role':'भूमिका','Phone':'फोन','Under Review':'समीक्षा में','Partners Found':'साझेदार मिले','Project Started':'प्रोजेक्ट शुरू','In Progress':'प्रगति में','Solution Submitted':'समाधान प्रस्तुत','Testing & Validation':'परीक्षण और सत्यापन','Implementation':'कार्यान्वयन','Resolved':'समाधान हो गया','View report insights':'रिपोर्ट की जानकारी देखें','Hide report insights':'रिपोर्ट की जानकारी छिपाएँ','Institution / partner':'संस्था / साझेदार','Sign out':'साइन आउट','Please wait…':'कृपया प्रतीक्षा करें…','No reports yet':'अभी कोई रिपोर्ट नहीं है','Language':'भाषा'
  },
  sat: {
    'Live issues':'ᱞᱟᱭᱵ ᱤᱥᱭᱩ','Report issue':'ᱤᱥᱭᱩ ᱨᱤᱯᱳᱨᱴ','My reports':'ᱤᱧᱟᱜ ᱨᱤᱯᱳᱨᱴ','AI opportunities':'AI ᱚᱯᱚᱨᱴᱩᱱᱤᱴᱤ','Projects':'ᱯᱨᱚᱡᱮᱠᱴ','Notifications':'ᱱᱳᱴᱤᱯᱷᱤᱠᱮᱥᱚᱱ','Language':'ᱯᱟᱹᱨᱥᱤ','Sign in':'ᱥᱟᱭᱤᱱ ᱤᱱ','Create account':'ᱮᱠᱟᱣᱩᱱᱴ ᱵᱟᱹᱱᱟᱣ','Citizen':'ᱱᱟᱜᱨᱤᱠ','Student':'ᱪᱷᱟᱛᱨᱚ','Faculty':'ᱯᱷᱟᱠᱟᱞᱴᱤ','College':'ᱠᱚᱞᱮᱡ','University':'ᱤᱣᱱᱤᱵᱷᱟᱨᱥᱤᱴᱤ','Description':'ᱵᱤᱵᱨᱚᱱ','Address':'ᱴᱷᱟᱶ','District':'ᱡᱤᱞᱟ','Block':'ᱵᱞᱚᱠ','Category':'ᱛᱷᱚᱠ','Urgency':'ᱛᱟᱹᱨᱟᱥ','Location':'ᱴᱷᱟᱶ','Save':'ᱡᱚᱢᱟ','Create':'ᱵᱟᱹᱱᱟᱣ','Active':'ᱥᱚᱨᱠᱟᱨ','Inactive':'ᱵᱟᱹᱝ ᱥᱚᱨᱠᱟᱨ','Sign out':'ᱥᱟᱭᱤᱱ ᱟᱣᱩᱴ'
  },
  nnp: {
    'Live issues':'लाइव समस्या','Report issue':'समस्या दर्ज करऽ','My reports':'हमर रिपोर्ट','AI opportunities':'AI अवसर','Projects':'प्रोजेक्ट','Notifications':'सूचना','Language':'भाषा','Sign in':'साइन इन','Create account':'खाता बनावऽ','Citizen':'नागरिक','Student':'छात्र','Faculty':'फैकल्टी','College':'कॉलेज','University':'विश्वविद्यालय','Description':'बिबरण','Address':'पता','District':'जिला','Block':'प्रखंड','Category':'श्रेणी','Urgency':'जरूरत','Location':'जगह','Save':'सहेजऽ','Create':'बनावऽ','Active':'चालू','Inactive':'बन्द','Sign out':'साइन आउट','Report problem':'समस्या दर्ज करऽ','Add institution':'संस्था जोड़ऽ','Create administrator':'प्रशासक बनावऽ','Overview':'जानकारी','Partners':'साझेदार','Projects':'प्रोजेक्ट','Current status':'अभी के स्थिति','Evidence':'सबूत'
  }
};

let currentLanguage:UiLanguage='en';
let applying=false;
const originals=new WeakMap<Text,string>();
const attrOriginals=new WeakMap<Element,Map<string,string>>();
const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','SELECT','OPTION']);
const ATTRS=['placeholder','aria-label','title'];
const cacheKey='smartsolve_ui_translation_cache_v2';

function cache(){try{return JSON.parse(localStorage.getItem(cacheKey)||'{}')}catch{return {}}}
function saveCache(v:any){try{localStorage.setItem(cacheKey,JSON.stringify(v))}catch{}}
function localTranslate(text:string,language:UiLanguage){
  if(language==='en')return text;
  const dict=DICT[language];
  if(dict[text])return dict[text];
  let out=text;
  for(const [from,to] of Object.entries(dict))if(out.includes(from))out=out.split(from).join(to);
  return out;
}
function collectStrings(){
  const found=new Set<string>();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node:Node|null;
  while((node=walker.nextNode())){const text=node as Text;const parent=text.parentElement;if(!parent||SKIP.has(parent.tagName))continue;const raw=originals.get(text)??text.nodeValue??'';if(raw.trim())found.add(raw);}
  for(const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))){if(SKIP.has(el.tagName))continue;for(const a of ATTRS){const v=el.getAttribute(a);if(v?.trim())found.add(v)}}
  return Array.from(found).slice(0,80);
}
function applyLocal(language:UiLanguage){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node:Node|null;
  while((node=walker.nextNode())){const text=node as Text;const parent=text.parentElement;if(!parent||SKIP.has(parent.tagName))continue;const raw=originals.get(text)??text.nodeValue??'';originals.set(text,raw);text.nodeValue=localTranslate(raw,language)}
  for(const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))){if(SKIP.has(el.tagName))continue;let m=attrOriginals.get(el);if(!m){m=new Map();attrOriginals.set(el,m)}for(const a of ATTRS){const v=el.getAttribute(a);if(v===null)continue;const raw=m.get(a)??v;m.set(a,raw);el.setAttribute(a,localTranslate(raw,language))}}
}
async function applyRemote(language:UiLanguage){
  if(language==='en')return;
  const c=cache();const strings=collectStrings().filter(s=>!c[language]?.[s]);if(!strings.length)return;
  try{const r=await fetch('/api/communication/ui-translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetLanguage:language,strings})});if(!r.ok)return;const d=await r.json();c[language]={...(c[language]||{}),...(d.translations||{})};saveCache(c);
    applying=true;const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node:Node|null;while((node=walker.nextNode())){const text=node as Text;const parent=text.parentElement;if(!parent||SKIP.has(parent.tagName))continue;const raw=originals.get(text)??text.nodeValue??'';text.nodeValue=c[language][raw]||localTranslate(raw,language)}for(const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))){const m=attrOriginals.get(el);if(!m)continue;for(const a of ATTRS){const raw=m.get(a);if(raw)el.setAttribute(a,c[language][raw]||localTranslate(raw,language))}}applying=false;
  }catch{applying=false}
}
export function applyUiLanguage(language:UiLanguage){currentLanguage=language;applying=true;applyLocal(language);applying=false;void applyRemote(language);document.documentElement.lang=language}
export function getUiLanguage(){return currentLanguage}
export function watchUiLanguage(){const observer=new MutationObserver(()=>{if(!applying)applyLocal(currentLanguage)});observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()}
