import { config } from "./config.js";
import { pool } from "./db/pool.js";

type Translation = { sourceLanguage:string; targetLanguage:string; originalTitle:string; originalDescription:string; translatedTitle:string; translatedDescription:string; translatedMetadata:any; provider:string; model:string|null };

export async function translateChallenge(challengeId:string,targetLanguage:string):Promise<Translation> {
  const c = await pool.query(`SELECT c.title,c.description,c.preferred_language,c.district,c.block,c.address,c.category,c.request_type,c.urgency_hint FROM challenges c WHERE c.id=$1`,[challengeId]);
  if(!c.rowCount) throw new Error("Challenge not found");
  const source = c.rows[0].preferred_language || "en";
  const existing = await pool.query(`SELECT source_language,target_language,original_title,original_description,translated_title,translated_description,translated_metadata,provider,model FROM challenge_translations WHERE challenge_id=$1 AND target_language=$2`,[challengeId,targetLanguage]);
  if(existing.rowCount && existing.rows[0].original_title===c.rows[0].title && existing.rows[0].original_description===c.rows[0].description) return existing.rows[0];
  if(source.toLowerCase()===targetLanguage.toLowerCase()) {
    const d={sourceLanguage:source,targetLanguage,originalTitle:c.rows[0].title,originalDescription:c.rows[0].description,translatedTitle:c.rows[0].title,translatedDescription:c.rows[0].description,translatedMetadata:{},provider:"identity",model:null};
    await saveTranslation(challengeId,d); return d;
  }
  if(!config.translationApiKey || !config.translationBaseUrl || !config.translationModel) throw new Error("Translation provider is not configured for this target language.");
  const analysis = await pool.query(`SELECT summary,subcategory,urgency,affected_sectors,keywords,expertise_tags,quality_notes FROM challenge_ai_analysis WHERE challenge_id=$1 ORDER BY analyzed_at DESC LIMIT 1`,[challengeId]);
  const sourceData={title:c.rows[0].title,description:c.rows[0].description,district:c.rows[0].district,block:c.rows[0].block,address:c.rows[0].address,category:c.rows[0].category,requestType:c.rows[0].request_type,urgency:c.rows[0].urgency_hint,ai:analysis.rows[0]||null};
  const response = await fetch(`${config.translationBaseUrl.replace(/\/$/,"")}/chat/completions`, { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${config.translationApiKey}`}, body:JSON.stringify({model:config.translationModel,temperature:0,response_format:{type:"json_object"},messages:[{role:"system",content:"You are SmartSolve's complete challenge translation service. Translate every human-readable value in the supplied challenge object into the requested language. Preserve IDs, slugs, numbers, coordinates, proper names and technical acronyms. Do not translate machine keys. Return JSON with translatedTitle, translatedDescription, and translatedMetadata. translatedMetadata must contain translated values for district, block, address, category, requestType, urgency, and ai (including summary, subcategory, affected_sectors, keywords, expertise_tags, quality_notes). Do not omit fields."},{role:"user",content:JSON.stringify({sourceLanguage:source,targetLanguage,data:sourceData})}]}) });
  if(!response.ok) throw new Error(`Translation provider returned HTTP ${response.status}`);
  const payload:any=await response.json(); const raw=payload?.choices?.[0]?.message?.content; if(typeof raw!=="string") throw new Error("Translation provider returned no content");
  let parsed:any; try{parsed=JSON.parse(raw)}catch{throw new Error("Translation provider returned invalid JSON")}
  if(typeof parsed.translatedTitle!=="string"||typeof parsed.translatedDescription!=="string"||!parsed.translatedMetadata||typeof parsed.translatedMetadata!=="object") throw new Error("Translation provider returned incomplete translation");
  const d={sourceLanguage:source,targetLanguage,originalTitle:c.rows[0].title,originalDescription:c.rows[0].description,translatedTitle:parsed.translatedTitle,translatedDescription:parsed.translatedDescription,translatedMetadata:parsed.translatedMetadata,provider:"external",model:config.translationModel}; await saveTranslation(challengeId,d); return d;
}

async function saveTranslation(challengeId:string,d:Translation){await pool.query(`INSERT INTO challenge_translations(challenge_id,source_language,target_language,original_title,original_description,translated_title,translated_description,translated_metadata,provider,model) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(challenge_id,target_language) DO UPDATE SET source_language=EXCLUDED.source_language,original_title=EXCLUDED.original_title,original_description=EXCLUDED.original_description,translated_title=EXCLUDED.translated_title,translated_description=EXCLUDED.translated_description,translated_metadata=EXCLUDED.translated_metadata,provider=EXCLUDED.provider,model=EXCLUDED.model,updated_at=NOW()`,[challengeId,d.sourceLanguage,d.targetLanguage,d.originalTitle,d.originalDescription,d.translatedTitle,d.translatedDescription,JSON.stringify(d.translatedMetadata||{}),d.provider,d.model]);}
export async function getTranslations(challengeId:string){const r=await pool.query(`SELECT * FROM challenge_translations WHERE challenge_id=$1 ORDER BY created_at DESC`,[challengeId]);return r.rows;}
