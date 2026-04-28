-- Update admin accounts to the requested production emails
-- and set their password to the provided value.

INSERT INTO public.admins (email) VALUES
  ('paul@authenticitynpurpose.com'),
  ('lucas@authenticitynpurpose.com')
ON CONFLICT (email) DO NOTHING;

DELETE FROM public.admins
WHERE email = 'admin@gad.com';

DO $$
DECLARE
  v_email text;
  v_user_id uuid;
  v_encrypted_pw text;
BEGIN
  FOREACH v_email IN ARRAY ARRAY[
    'paul@authenticitynpurpose.com',
    'lucas@authenticitynpurpose.com'
  ]
  LOOP
    v_encrypted_pw := crypt('12345678', gen_salt('bf'));

    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      UPDATE auth.users
      SET
        encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        updated_at = now()
      WHERE email = v_email;
    ELSE
      v_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_pw,
        now(),
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now()
      );

      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id,
        v_user_id,
        format('{"sub": "%s", "email": "%s"}', v_user_id, v_email)::jsonb,
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
      );
    END IF;
  END LOOP;
END $$;
