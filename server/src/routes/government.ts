import { Router } from "express";
import { routeParam } from "../params.js";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRoles } from "../middleware.js";
import { notifyUser } from "../notifications.js";
import { audit } from "../audit.js";

export const governmentRouter = Router();
const admin = ["GOVERNMENT", "SUPER_ADMIN"] as const;

function q(s: string) { return s.trim().slice(0, 100); }

// Government overview: operational KPIs plus district/category trends.
governmentRouter.get("/dashboard", requireAuth, requireRoles(...admin), async (_req, res) => {
  const [counts, districts, categories, statuses, projects, impact, urgent] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM challenges) AS total_challenges,
      (SELECT COUNT(*)::int FROM challenges WHERE status='RESOLVED') AS resolved_challenges,
      (SELECT COUNT(*)::int FROM projects) AS total_projects,
      (SELECT COUNT(*)::int FROM projects WHERE status='COMPLETED') AS completed_projects,
      (SELECT COUNT(*)::int FROM organizations WHERE active) AS active_organizations,
      (SELECT COUNT(*)::int FROM organizations WHERE verified AND active) AS verified_organizations,
      (SELECT COUNT(*)::int FROM users WHERE active) AS active_users,
      (SELECT COUNT(*)::int FROM challenges WHERE urgency_hint='URGENT' AND status<>'RESOLVED') AS urgent_open`),
    pool.query(`SELECT COALESCE(NULLIF(district,''),'Unknown') AS district, COUNT(*)::int AS challenges,
      COUNT(*) FILTER (WHERE status='RESOLVED')::int AS resolved,
      COUNT(*) FILTER (WHERE status IN ('ADOPTED','SOLUTION_DEVELOPMENT','SOLUTION_PROPOSED','IMPLEMENTATION'))::int AS active
      FROM challenges GROUP BY 1 ORDER BY challenges DESC, district LIMIT 24`),
    pool.query(`SELECT COALESCE(cat.name,'Uncategorized') AS category, COUNT(*)::int AS challenges,
      COUNT(*) FILTER (WHERE c.status='RESOLVED')::int AS resolved
      FROM challenges c LEFT JOIN categories cat ON cat.id=c.category_id GROUP BY 1 ORDER BY challenges DESC LIMIT 20`),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM challenges GROUP BY status ORDER BY count DESC`),
    pool.query(`SELECT p.id,p.title,p.status,p.created_at,o.name AS organization_name,c.district,c.urgency_hint
      FROM projects p JOIN organizations o ON o.id=p.lead_organization_id JOIN challenges c ON c.id=p.challenge_id
      ORDER BY p.updated_at DESC LIMIT 12`),
    pool.query(`SELECT COALESCE(SUM(people_affected),0)::int AS people_affected,
      COALESCE(SUM(villages_affected),0)::int AS villages_affected,
      COALESCE(SUM(time_saved_hours),0)::numeric AS time_saved_hours,
      COUNT(*)::int AS impact_records FROM impact_records`),
    pool.query(`SELECT c.id,c.title,c.district,c.urgency_hint,c.status,c.created_at,cat.name AS category
      FROM challenges c LEFT JOIN categories cat ON cat.id=c.category_id
      WHERE c.urgency_hint IN ('URGENT','HIGH') AND c.status<>'RESOLVED'
      ORDER BY CASE c.urgency_hint WHEN 'URGENT' THEN 0 ELSE 1 END,c.created_at DESC LIMIT 12`)
  ]);
  res.json({ kpis: counts.rows[0], districts: districts.rows, categories: categories.rows, statuses: statuses.rows,
    recentProjects: projects.rows, impact: impact.rows[0], urgent: urgent.rows });
});

governmentRouter.get("/challenges", requireAuth, requireRoles(...admin), async (req, res) => {
  const district = q(String(req.query.district || ""));
  const status = q(String(req.query.status || ""));
  const category = q(String(req.query.category || ""));
  const search = q(String(req.query.search || ""));
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
  const values: any[] = []; const where: string[] = ["COALESCE(cm.status,'VISIBLE') <> 'REMOVED'"];
  if (district) { values.push(district); where.push(`c.district=$${values.length}`); }
  if (status) { values.push(status); where.push(`c.status=$${values.length}`); }
  if (category) { values.push(category); where.push(`cat.slug=$${values.length}`); }
  if (search) { values.push(`%${search}%`); where.push(`(c.title ILIKE $${values.length} OR c.description ILIKE $${values.length})`); }
  values.push(limit);
  const r = await pool.query(`SELECT c.id,c.title,c.description,c.status,c.urgency_hint,c.district,c.block,c.latitude,c.longitude,c.created_at,
    cat.name AS category,rt.name AS request_type,cm.status AS moderation_status, u.full_name AS citizen_name
    FROM challenges c LEFT JOIN categories cat ON cat.id=c.category_id LEFT JOIN request_types rt ON rt.id=c.request_type_id
    LEFT JOIN challenge_moderation cm ON cm.challenge_id=c.id JOIN users u ON u.id=c.citizen_id
    WHERE ${where.join(" AND ")} ORDER BY c.created_at DESC LIMIT $${values.length}`, values);
  res.json({ challenges: r.rows });
});

governmentRouter.get("/organizations", requireAuth, requireRoles(...admin), async (_req,res)=>{
  const r=await pool.query(`SELECT o.*,s.average_rating,s.rating_count,(SELECT COUNT(*)::int FROM users u WHERE u.organization_id=o.id AND u.active) AS member_count
    FROM organizations o JOIN organization_rating_summary s ON s.organization_id=o.id ORDER BY o.verified DESC,o.name`);
  res.json({organizations:r.rows});
});

governmentRouter.patch("/organizations/:id", requireAuth, requireRoles(...admin), async (req,res)=>{
  const p=z.object({
    name:z.string().trim().min(2).max(180).optional(), description:z.string().trim().max(3000).optional(), district:z.string().trim().max(100).nullable().optional(),
    address:z.string().trim().max(500).nullable().optional(), latitude:z.number().min(-90).max(90).nullable().optional(), longitude:z.number().min(-180).max(180).nullable().optional(),
    verified:z.boolean().optional(), active:z.boolean().optional(), moderationStatus:z.enum(["VISIBLE","HIDDEN","REMOVED"]).optional(),
    categories:z.array(z.string().trim().min(1).max(120)).optional(), expertise:z.array(z.string().trim().min(1).max(120)).optional(), requestTypes:z.array(z.string().trim().min(1).max(120)).optional()
  }).safeParse(req.body);
  if(!p.success)return res.status(400).json({error:"Invalid organization update"});
  const d=p.data; const id=routeParam(req,"id");
  const r=await pool.query(`UPDATE organizations SET name=COALESCE($1,name),description=COALESCE($2,description),district=COALESCE($3,district),address=COALESCE($4,address),
    latitude=COALESCE($5,latitude),longitude=COALESCE($6,longitude),verified=COALESCE($7,verified),active=COALESCE($8,active),
    moderation_status=COALESCE($9,moderation_status),verified_at=CASE WHEN $7=true THEN NOW() WHEN $7=false THEN NULL ELSE verified_at END,
    verified_by=CASE WHEN $7 IS NOT NULL THEN $10 ELSE verified_by END WHERE id=$11 RETURNING *`,
    [d.name??null,d.description??null,d.district??null,d.address??null,d.latitude??null,d.longitude??null,d.verified??null,d.active??null,d.moderationStatus??null,req.auth!.userId,id]);
  if(!r.rowCount)return res.status(404).json({error:"Organization not found"});
  if(d.categories) { await pool.query("DELETE FROM organization_categories WHERE organization_id=$1",[id]); for(const slug of [...new Set(d.categories.map(x=>x.toLowerCase()))]) await pool.query(`INSERT INTO organization_categories(organization_id,category_id) SELECT $1,id FROM categories WHERE slug=$2 ON CONFLICT DO NOTHING`,[id,slug]); }
  if(d.expertise) { await pool.query("DELETE FROM organization_expertise WHERE organization_id=$1",[id]); for(const slug of [...new Set(d.expertise.map(x=>x.toLowerCase()))]) await pool.query(`INSERT INTO organization_expertise(organization_id,expertise_id) SELECT $1,id FROM expertise_tags WHERE slug=$2 AND active=TRUE ON CONFLICT DO NOTHING`,[id,slug]); }
  if(d.requestTypes) { await pool.query("DELETE FROM organization_request_types WHERE organization_id=$1",[id]); for(const slug of [...new Set(d.requestTypes.map(x=>x.toLowerCase()))]) await pool.query(`INSERT INTO organization_request_types(organization_id,request_type_id) SELECT $1,id FROM request_types WHERE slug=$2 ON CONFLICT DO NOTHING`,[id,slug]); }
  await audit(req.auth!.userId, "ORGANIZATION_GOVERNANCE_UPDATED", "ORGANIZATION", id, d);
  res.json({organization:r.rows[0]});
});

governmentRouter.patch("/challenges/:id/moderation", requireAuth, requireRoles(...admin), async(req,res)=>{
  const p=z.object({status:z.enum(["VISIBLE","HIDDEN","REMOVED"]),reason:z.string().trim().max(1000).default("")}).safeParse(req.body);
  if(!p.success)return res.status(400).json({error:"Invalid moderation update"});
  const exists=await pool.query("SELECT citizen_id,title FROM challenges WHERE id=$1",[routeParam(req, "id")]);
  if(!exists.rowCount)return res.status(404).json({error:"Challenge not found"});
  const r=await pool.query(`INSERT INTO challenge_moderation(challenge_id,status,reason,moderated_by,moderated_at) VALUES($1,$2,$3,$4,NOW())
    ON CONFLICT(challenge_id) DO UPDATE SET status=EXCLUDED.status,reason=EXCLUDED.reason,moderated_by=EXCLUDED.moderated_by,moderated_at=NOW() RETURNING *`,
    [routeParam(req, "id"),p.data.status,p.data.reason,req.auth!.userId]);
  await notifyUser(exists.rows[0].citizen_id,"CHALLENGE_MODERATED","Challenge moderation updated",`Your challenge “${exists.rows[0].title}” is now ${p.data.status.toLowerCase()}.`,"CHALLENGE",routeParam(req, "id"));
  await audit(req.auth!.userId, "CHALLENGE_MODERATION_UPDATED", "CHALLENGE", routeParam(req, "id"), p.data);
  res.json({moderation:r.rows[0]});
});

// Ratings are deliberately limited to people who actually participated in the project.
governmentRouter.post("/ratings", requireAuth, async(req,res)=>{
  const p=z.object({projectId:z.string().uuid(),organizationId:z.string().uuid(),rating:z.number().int().min(1).max(5),review:z.string().trim().max(2000).default("")}).safeParse(req.body);
  if(!p.success)return res.status(400).json({error:"Invalid rating"});
  const project=await pool.query(`SELECT p.*,c.citizen_id FROM projects p JOIN challenges c ON c.id=p.challenge_id WHERE p.id=$1 AND p.lead_organization_id=$2`,[p.data.projectId,p.data.organizationId]);
  if(!project.rowCount)return res.status(404).json({error:"Project not found"});
  const participant=await pool.query(`SELECT 1 WHERE $1::uuid=$2::uuid OR EXISTS(SELECT 1 FROM project_members WHERE project_id=$3 AND user_id=$4 AND status='ACTIVE')`,[req.auth!.userId,project.rows[0].citizen_id,p.data.projectId,req.auth!.userId]);
  if(!participant.rowCount)return res.status(403).json({error:"Ratings require a real interaction with the project."});
  try {
    const r=await pool.query(`INSERT INTO organization_ratings(organization_id,project_id,reviewer_id,rating,review) VALUES($1,$2,$3,$4,$5) RETURNING *`,[p.data.organizationId,p.data.projectId,req.auth!.userId,p.data.rating,p.data.review]);
    await audit(req.auth!.userId, "ORGANIZATION_RATED", "PROJECT", p.data.projectId, { organizationId: p.data.organizationId, rating: p.data.rating });
    res.status(201).json({rating:r.rows[0]});
  } catch { res.status(409).json({error:"You have already rated this organization for this project."}); }
});

governmentRouter.get("/ratings/:organizationId", requireAuth, async(req,res)=>{
  const r=await pool.query(`SELECT r.id,r.rating,r.review,r.created_at,u.full_name AS reviewer_name,p.title AS project_title
    FROM organization_ratings r JOIN users u ON u.id=r.reviewer_id JOIN projects p ON p.id=r.project_id WHERE r.organization_id=$1 ORDER BY r.created_at DESC`,[routeParam(req, "organizationId")]);
  res.json({ratings:r.rows});
});

governmentRouter.post("/organizations", requireAuth, requireRoles(...admin), async (req, res) => {
  const p = z.object({
    name: z.string().trim().min(2).max(180),
    organizationType: z.enum(["COLLEGE","UNIVERSITY","INDUSTRY","STARTUP","MSME","CSR","RESEARCH_LAB","INNOVATION_HUB","COMMUNITY_ORG","PANCHAYAT","ULB","GOVERNMENT_AGENCY"]),
    description: z.string().trim().max(3000).default(""),
    district: z.string().trim().max(100).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    verified: z.boolean().default(true),
    categories: z.array(z.string().trim().min(1).max(120)).default([]),
    expertise: z.array(z.string().trim().min(1).max(120)).default([]),
    requestTypes: z.array(z.string().trim().min(1).max(120)).default([])
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid organization data", details: p.error.flatten() });

  const d = p.data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const org = await client.query(`INSERT INTO organizations
      (name,organization_type,description,district,address,latitude,longitude,verified,active)
      VALUES($1,$2::organization_type,$3,$4,$5,$6,$7,$8,TRUE) RETURNING *`,
      [d.name,d.organizationType,d.description,d.district??null,d.address??null,d.latitude??null,d.longitude??null,d.verified]);
    const id = org.rows[0].id;

    const categories = [...new Set(d.categories.map(x => x.toLowerCase()))];
    for (const slug of categories) {
      await client.query(`INSERT INTO organization_categories(organization_id,category_id)
        SELECT $1,id FROM categories WHERE slug=$2 ON CONFLICT DO NOTHING`, [id, slug]);
    }
    const expertise = [...new Set(d.expertise.map(x => x.toLowerCase()))];
    for (const slug of expertise) {
      await client.query(`INSERT INTO organization_expertise(organization_id,expertise_id)
        SELECT $1,id FROM expertise_tags WHERE slug=$2 AND active=TRUE ON CONFLICT DO NOTHING`, [id, slug]);
    }
    const requestTypes = [...new Set(d.requestTypes.map(x => x.toLowerCase()))];
    for (const slug of requestTypes) {
      await client.query(`INSERT INTO organization_request_types(organization_id,request_type_id)
        SELECT $1,id FROM request_types WHERE slug=$2 ON CONFLICT DO NOTHING`, [id, slug]);
    }
    await client.query("COMMIT");
    await audit(req.auth!.userId, "ORGANIZATION_CREATED", "ORGANIZATION", id, { name:d.name, organizationType:d.organizationType });
    res.status(201).json({ organization: org.rows[0] });
  } catch (error:any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") return res.status(409).json({ error: "An organization with this name already exists" });
    throw error;
  } finally { client.release(); }
});

governmentRouter.post("/users", requireAuth, requireRoles(...admin), async (req, res) => {
  const p = z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(180),
    password: z.string().min(12).max(128),
    role: z.enum(["GOVERNMENT","SUPER_ADMIN","ORGANIZATION_ADMIN"]),
    organizationId: z.string().uuid().nullable().optional(),
    phone: z.string().trim().max(25).nullable().optional(),
    preferredLanguage: z.string().trim().max(20).default("en")
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid administrator account data", details: p.error.flatten() });
  if (req.auth!.role === "GOVERNMENT" && p.data.role === "SUPER_ADMIN") return res.status(403).json({ error: "Only a Super Admin can create another Super Admin." });
  if (p.data.role === "ORGANIZATION_ADMIN" && !p.data.organizationId) return res.status(400).json({ error: "Organization Admin accounts require an organization." });
  if (p.data.organizationId) {
    const org = await pool.query("SELECT id,active FROM organizations WHERE id=$1", [p.data.organizationId]);
    if (!org.rowCount || !org.rows[0].active) return res.status(400).json({ error: "Selected organization is unavailable" });
  }
  const exists = await pool.query("SELECT 1 FROM users WHERE email=$1", [p.data.email]);
  if (exists.rowCount) return res.status(409).json({ error: "An account with this email already exists" });
  const { hashPassword } = await import("../auth.js");
  const passwordHash = await hashPassword(p.data.password);
  const result = await pool.query(`INSERT INTO users
    (full_name,email,password_hash,role,organization_id,phone,preferred_language)
    VALUES($1,$2,$3,$4::user_role,$5,$6,$7)
    RETURNING id,full_name,email,role,organization_id,preferred_language,active`,
    [p.data.fullName,p.data.email,passwordHash,p.data.role,p.data.organizationId??null,p.data.phone??null,p.data.preferredLanguage]);
  await audit(req.auth!.userId, "ADMIN_ACCOUNT_CREATED", "USER", result.rows[0].id, { role:p.data.role, email:p.data.email });
  res.status(201).json({ user: result.rows[0] });
});

governmentRouter.get("/users", requireAuth, requireRoles(...admin), async (_req,res)=>{
  const r=await pool.query(`SELECT u.id,u.full_name,u.email,u.role,u.organization_id,u.preferred_language,u.active,u.created_at,o.name AS organization_name
    FROM users u LEFT JOIN organizations o ON o.id=u.organization_id
    WHERE u.role IN ('GOVERNMENT','SUPER_ADMIN','ORGANIZATION_ADMIN') ORDER BY u.role,u.full_name`);
  res.json({users:r.rows});
});

governmentRouter.patch("/users/:id", requireAuth, requireRoles(...admin), async(req,res)=>{
  const p=z.object({active:z.boolean()}).safeParse(req.body);
  if(!p.success)return res.status(400).json({error:"Invalid account update"});
  const id=routeParam(req,"id");
  const target=await pool.query("SELECT role FROM users WHERE id=$1",[id]);
  if(!target.rowCount)return res.status(404).json({error:"User not found"});
  if(target.rows[0].role==='SUPER_ADMIN' && req.auth!.role!=='SUPER_ADMIN')return res.status(403).json({error:"Only a Super Admin can manage a Super Admin account."});
  const r=await pool.query("UPDATE users SET active=$1 WHERE id=$2 RETURNING id,full_name,email,role,organization_id,active",[p.data.active,id]);
  await audit(req.auth!.userId,"ADMIN_ACCOUNT_STATUS_UPDATED","USER",id,{active:p.data.active});
  res.json({user:r.rows[0]});
});

governmentRouter.get("/projects", requireAuth, requireRoles(...admin), async (_req,res)=>{
  const r=await pool.query(`SELECT p.id,p.title,p.description,p.status,p.created_at,p.updated_at,o.name AS organization_name,
    c.id AS challenge_id,c.title AS challenge_title,c.status AS challenge_status,c.district,c.urgency_hint,
    (SELECT COUNT(*)::int FROM project_members pm WHERE pm.project_id=p.id AND pm.status='ACTIVE') AS member_count,
    (SELECT COUNT(*)::int FROM project_updates pu WHERE pu.project_id=p.id) AS update_count
    FROM projects p JOIN organizations o ON o.id=p.lead_organization_id JOIN challenges c ON c.id=p.challenge_id
    ORDER BY p.updated_at DESC LIMIT 100`);
  res.json({projects:r.rows});
});
