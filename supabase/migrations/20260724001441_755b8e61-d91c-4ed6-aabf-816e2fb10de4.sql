DROP TRIGGER IF EXISTS workspaces_touch_sync ON public.workspaces;
DROP FUNCTION IF EXISTS public.touch_workspace_sync();
DROP TABLE IF EXISTS public.workspace_sync;