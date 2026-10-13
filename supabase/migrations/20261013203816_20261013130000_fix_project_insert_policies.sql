/*
# Restore project save permissions

1. Purpose
- Ensure the project calculator can create and update projects for both anonymous guest sessions and authenticated sessions.

2. Modified tables
- `projects`: preserve shared project CRUD for the existing single-tenant app.
- `project_materials`: preserve shared material CRUD for saved project calculations.

3. Security
- RLS remains enabled.
- Four separate policies are recreated for each table and explicitly include both `anon` and `authenticated` roles.
- These tables are intentionally shared by the current app because guest users do not have an authenticated owner identity.

4. Important notes
- This migration does not delete or alter existing project data.
- The client will still use local device storage for guest projects, while signed-in users continue using Supabase.
*/

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_project_materials" ON project_materials;
CREATE POLICY "anon_select_project_materials" ON project_materials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_project_materials" ON project_materials;
CREATE POLICY "anon_insert_project_materials" ON project_materials FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_project_materials" ON project_materials;
CREATE POLICY "anon_update_project_materials" ON project_materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_project_materials" ON project_materials;
CREATE POLICY "anon_delete_project_materials" ON project_materials FOR DELETE TO anon, authenticated USING (true);
