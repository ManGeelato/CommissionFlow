-- Allow a business owner to look up registered profiles while adding staff.
-- RLS remains enabled; this only exposes profiles already linked to that owner's business.
DROP POLICY IF EXISTS "profiles_select_business_staff" ON public.profiles;

CREATE POLICY "profiles_select_business_staff"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM public.businesses b
    JOIN public.staff_profiles sp ON sp.business_id = b.id
    WHERE b.owner_id = auth.uid()
      AND sp.user_id = profiles.id
  )
);
