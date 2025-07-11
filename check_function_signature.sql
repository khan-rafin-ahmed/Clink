-- Check the current function signature for send_event_invitations_to_crew
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'send_event_invitations_to_crew'
  AND routine_schema = 'public';

-- Also check what parameters it expects
SELECT 
    routine_name,
    parameter_name,
    parameter_mode,
    data_type,
    ordinal_position
FROM information_schema.parameters 
WHERE specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'send_event_invitations_to_crew'
      AND routine_schema = 'public'
)
ORDER BY ordinal_position;
