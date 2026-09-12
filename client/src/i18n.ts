export type UiLanguage = 'en' | 'hi' | 'sat' | 'nnp';

const DICT: Record<Exclude<UiLanguage,'en'>, Record<string,string>> = {
  hi: {
    'Live issues':'लाइव समस्याएँ','Report issue':'समस्या दर्ज करें','My reports':'मेरी रिपोर्ट','AI opportunities':'AI अवसर','Projects':'परियोजनाएँ','Organization':'संस्था','Command center':'कमांड सेंटर','Notifications':'सूचनाएँ','Project channel':'प्रोजेक्ट चैनल','Contact requests':'संपर्क अनुरोध','Language':'भाषा','SOS':'SOS','Sign in':'साइन इन','Create account':'खाता बनाएँ','Citizen':'नागरिक','Student':'छात्र','Faculty':'फैकल्टी','Industry Member':'उद्योग सदस्य','Full name':'पूरा नाम','Email':'ईमेल','Password':'पासवर्ड','Account type':'खाता प्रकार','English':'अंग्रेज़ी','Hindi':'हिंदी','Santali':'संताली','Nagpuri':'नागपुरी','Report an issue':'समस्या दर्ज करें','Describe the problem. SmartSolve will classify it, assess urgency and find institutions that can take it forward.':'समस्या का विवरण दें। SmartSolve इसे वर्गीकृत करेगा, तात्कालिकता का आकलन करेगा और उपयुक्त संस्थाएँ खोजेगा।','Issue title':'समस्या का शीर्षक','What is happening?':'क्या हो रहा है?','District':'जिला','Block':'प्रखंड','Category':'श्रेणी','How can others help?':'दूसरे कैसे मदद कर सकते हैं?','Urgency':'तात्कालिकता','Location / landmark':'स्थान / लैंडमार्क','Submit issue':'समस्या भेजें','Choose photos, videos or documents':'फोटो, वीडियो या दस्तावेज़ चुनें','Allow a project team to request my contact details':'प्रोजेक्ट टीम को मेरी संपर्क जानकारी का अनुरोध करने की अनुमति दें','Best-fit institutions':'सबसे उपयुक्त संस्थाएँ','Refresh matches':'मैचिंग रीफ्रेश करें','Problems your organization can solve':'वे समस्याएँ जिन्हें आपकी संस्था हल कर सकती है','Take this challenge':'यह चुनौती लें','Issue command center':'समस्या कमांड सेंटर','Review live public issues, follow institutional action and monitor outcomes from one operational workspace.':'सार्वजनिक समस्याओं की समीक्षा करें, संस्थागत कार्रवाई देखें और परिणामों की निगरानी करें।','Issue queue':'समस्या कतार','Overview':'अवलोकन','Partners':'साझेदार','Hide':'छिपाएँ','Restore':'पुनर्स्थापित करें','Progress':'प्रगति','Reporter':'रिपोर्टर','Reported':'रिपोर्ट की गई','Impact':'प्रभाव','District load':'जिला भार','Verify partner':'साझेदार सत्यापित करें','Revoke verification':'सत्यापन हटाएँ','Add institution':'संस्था जोड़ें','Create administrator':'प्रशासक बनाएँ','Government accounts':'सरकारी खाते','Administrator accounts':'प्रशासक खाते','Save':'सहेजें','Create':'बनाएँ','Active':'सक्रिय','Inactive':'निष्क्रिय','College':'कॉलेज','University':'विश्वविद्यालय','Industry':'उद्योग','Description':'विवरण','Address':'पता','Accepted problem areas':'स्वीकृत समस्या क्षेत्र','Expertise':'विशेषज्ञता','Accepted work types':'स्वीकृत कार्य प्रकार','Role':'भूमिका','Phone':'फोन','Create trusted account':'विश्वसनीय खाता बनाएँ','Only authorized administrators can create these accounts.':'इन खातों को केवल अधिकृत प्रशासक ही बना सकते हैं।'
  },
  sat: {
    'Live issues':'ᱞᱟᱭᱵ ᱤᱥᱭᱩ','Report issue':'ᱤᱥᱭᱩ ᱨᱤᱯᱳᱨᱴ','My reports':'ᱤᱧᱟᱜ ᱨᱤᱯᱳᱨᱴ','Projects':'ᱯᱨᱚᱡᱮᱠᱴ','Language':'ᱯᱟᱹᱨᱥᱤ','Sign in':'ᱥᱟᱭᱤᱱ ᱤᱱ','Create account':'ᱮᱠᱟᱣᱩᱱᱴ ᱵᱟᱹᱱᱟᱣ','Citizen':'ᱱᱟᱜᱨᱤᱠ','Student':'ᱪᱷᱟᱛᱨᱚ','Faculty':'ᱯᱷᱟᱠᱟᱞᱴᱤ','College':'ᱠᱚᱞᱮᱡ','University':'ᱤᱣᱱᱤᱵᱷᱟᱨᱥᱤᱴᱤ','Description':'ᱵᱤᱵᱨᱚᱱ','Address':'ᱴᱷᱟᱶ'
  },
  nnp: {
    'Live issues':'लाइव समस्या','Report issue':'समस्या दर्ज करऽ','My reports':'हमर रिपोर्ट','Projects':'प्रोजेक्ट','Language':'भाषा','Sign in':'साइन इन','Create account':'खाता बनावऽ','Citizen':'नागरिक','Student':'छात्र','Faculty':'फैकल्टी','College':'कॉलेज','University':'विश्वविद्यालय','Description':'बिबरण','Address':'पता'
  }
};

let currentLanguage: UiLanguage = 'en';
let applying = false;
const originals = new WeakMap<Text,string>();
const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','SELECT','OPTION']);

function translateString(text:string, language:UiLanguage){
  if(language==='en') return text;
  const dict=DICT[language];
  if(dict[text]) return dict[text];
  let out=text;
  for(const [from,to] of Object.entries(dict)) if(out.includes(from)) out=out.split(from).join(to);
  return out;
}

export function applyUiLanguage(language:UiLanguage){
  currentLanguage=language;
  applying=true;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node:Node|null;
  while((node=walker.nextNode())){
    const text=node as Text;
    const parent=text.parentElement;
    if(!parent || SKIP.has(parent.tagName)) continue;
    const raw=originals.get(text) ?? text.nodeValue ?? '';
    originals.set(text,raw);
    text.nodeValue=translateString(raw,language);
  }
  document.documentElement.lang=language;
  applying=false;
}

export function getUiLanguage(){ return currentLanguage; }


export function watchUiLanguage(){
  const observer=new MutationObserver(()=>{ if(!applying) applyUiLanguage(currentLanguage); });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  return ()=>observer.disconnect();
}
