REVOKE EXECUTE ON FUNCTION public.get_emergency_profile(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_emergency_profile(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_emergency_profile(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_emergency_profile(text) TO service_role;