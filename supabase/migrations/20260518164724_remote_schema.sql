drop extension if exists "pg_net";

create type "public"."document_type" as enum ('plan_materiel', 'bulle_ssi', 'ddb_mairie', 'ddb_prev', 'autre');

create type "public"."event_status" as enum ('brouillon', 'soumise', 'en_revision', 'validee', 'refusee');

create type "public"."notification_type" as enum ('nouveau_message', 'statut_change', 'deadline_proche');


  create table "public"."event_documents" (
    "id" uuid not null default gen_random_uuid(),
    "form_id" uuid not null,
    "type" public.document_type not null,
    "file_path" text not null,
    "uploaded_at" timestamp with time zone default now()
      );


alter table "public"."event_documents" enable row level security;


  create table "public"."event_forms" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "status" public.event_status not null default 'brouillon'::public.event_status,
    "version" integer not null default 0,
    "signed_by" uuid,
    "signed_at" timestamp with time zone,
    "title" text not null,
    "event_date" date not null,
    "event_start_time" time without time zone not null,
    "event_end_time" time without time zone not null,
    "location" text not null,
    "category" text not null,
    "description" text,
    "budget" numeric,
    "estimated_attendees" integer,
    "has_external_people" boolean default false,
    "deadline" date,
    "needs_equipment" boolean default false,
    "needs_communication" boolean default false,
    "has_food" boolean default false,
    "site_plan_path" text,
    "needs_bulle_ssi" boolean default false,
    "needs_agent_secu" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "submitted_at" timestamp with time zone,
    "event_end_date" date,
    "equipment" jsonb,
    "communication" jsonb default '{"intranet": false, "mur_ecrans": false, "newsletter": false, "description": "", "reseaux_sociaux": false}'::jsonb,
    "food" jsonb default '{"menu": "", "has_caterer": false, "caterer_name": "", "organisation": "", "caterer_siret": ""}'::jsonb,
    "responsible_prevention" jsonb default '{"nom": "", "email": "", "prenom": "", "telephone": "", "departement": ""}'::jsonb,
    "responsible_security" jsonb default '{"nom": "", "email": "", "prenom": "", "telephone": "", "departement": ""}'::jsonb,
    "responsible_organisation" jsonb default '{"nom": "", "email": "", "prenom": "", "telephone": "", "departement": ""}'::jsonb,
    "alcohol" jsonb default '{"enabled": false, "ddb_mairie": {"date_demande": "", "autorisation_path": ""}, "prevention": {"navettes": {"oui": false, "description": ""}, "taxi_vtc": {"oui": false, "description": ""}, "espace_repos": {"oui": false, "description": ""}, "poste_secours": {"oui": false, "description": ""}, "eau_disposition": {"oui": false, "description": ""}, "capitaine_soiree": {"oui": false, "description": ""}, "stand_prevention": {"oui": false, "description": ""}, "affichage_transports": {"oui": false, "description": ""}}, "structure_licence": "", "ddb_nantes_universite": {"date_demande": "", "autorisation_path": ""}}'::jsonb,
    "security" jsonb default '{"cles": {"sud": {"key": "E1+110", "selected": false}, "est_E3": {"key": "E3", "selected": false}, "est_E4": {"key": "E4", "selected": false}, "est_E5": {"key": "E5", "selected": false}, "est_E6": {"key": "E6", "selected": false}, "nord_E7": {"key": "E7", "selected": false}, "nord_S8": {"key": "S8", "selected": false}, "ouest_E9": {"key": "E9", "selected": false}, "ouest_S0": {"key": "S0", "selected": false}, "est_E2_111": {"key": "E2+111", "selected": false}, "portique_parking": {"key": "Portique parking", "selected": false}}, "salle_ssi": []}'::jsonb,
    "agent_secu" jsonb default '{"secouristes": {"dispositions": "", "has_organisme": false, "organisme_nom": "", "organisme_siret": "", "organisme_devis_path": ""}, "entreprise_securite": {"nom": "", "siret": "", "devis_path": ""}}'::jsonb
      );


alter table "public"."event_forms" enable row level security;


  create table "public"."message_reads" (
    "message_id" uuid not null,
    "profile_id" uuid not null,
    "read_at" timestamp with time zone default now()
      );


alter table "public"."message_reads" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "form_id" uuid not null,
    "sender_id" uuid,
    "content" text not null,
    "form_version" integer not null default 1,
    "created_at" timestamp with time zone default now(),
    "is_system" boolean default false
      );


alter table "public"."messages" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "form_id" uuid,
    "type" public.notification_type not null,
    "is_sent" boolean default false,
    "send_after" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "name" text not null,
    "email" text not null,
    "created_at" timestamp with time zone default now(),
    "role_id" uuid not null
      );


alter table "public"."profiles" enable row level security;


  create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "label" text not null,
    "is_system" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."roles" enable row level security;


  create table "public"."settings" (
    "key" text not null,
    "value" jsonb not null,
    "description" text,
    "updated_at" timestamp with time zone default now(),
    "updated_by" uuid
      );


alter table "public"."settings" enable row level security;


  create table "public"."signatures" (
    "id" uuid not null default gen_random_uuid(),
    "form_id" uuid not null,
    "workflow_etape_id" uuid,
    "signed_by" uuid,
    "signed_at" timestamp with time zone,
    "status" text not null default 'en_attente'::text,
    "created_at" timestamp with time zone default now(),
    "role_label" text
      );


alter table "public"."signatures" enable row level security;


  create table "public"."workflow_etapes" (
    "id" uuid not null default gen_random_uuid(),
    "role_id" uuid not null,
    "ordre" integer not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."workflow_etapes" enable row level security;

CREATE UNIQUE INDEX event_documents_pkey ON public.event_documents USING btree (id);

CREATE UNIQUE INDEX event_forms_pkey ON public.event_forms USING btree (id);

CREATE UNIQUE INDEX message_reads_pkey ON public.message_reads USING btree (message_id, profile_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (key);

CREATE UNIQUE INDEX signatures_form_id_workflow_etape_id_key ON public.signatures USING btree (form_id, workflow_etape_id);

CREATE UNIQUE INDEX signatures_pkey ON public.signatures USING btree (id);

CREATE UNIQUE INDEX workflow_etapes_ordre_key ON public.workflow_etapes USING btree (ordre);

CREATE UNIQUE INDEX workflow_etapes_pkey ON public.workflow_etapes USING btree (id);

alter table "public"."event_documents" add constraint "event_documents_pkey" PRIMARY KEY using index "event_documents_pkey";

alter table "public"."event_forms" add constraint "event_forms_pkey" PRIMARY KEY using index "event_forms_pkey";

alter table "public"."message_reads" add constraint "message_reads_pkey" PRIMARY KEY using index "message_reads_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "public"."signatures" add constraint "signatures_pkey" PRIMARY KEY using index "signatures_pkey";

alter table "public"."workflow_etapes" add constraint "workflow_etapes_pkey" PRIMARY KEY using index "workflow_etapes_pkey";

alter table "public"."event_documents" add constraint "event_documents_form_id_fkey" FOREIGN KEY (form_id) REFERENCES public.event_forms(id) ON DELETE CASCADE not valid;

alter table "public"."event_documents" validate constraint "event_documents_form_id_fkey";

alter table "public"."event_forms" add constraint "event_forms_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."event_forms" validate constraint "event_forms_profile_id_fkey";

alter table "public"."event_forms" add constraint "event_forms_signed_by_fkey" FOREIGN KEY (signed_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."event_forms" validate constraint "event_forms_signed_by_fkey";

alter table "public"."message_reads" add constraint "message_reads_message_id_fkey" FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE not valid;

alter table "public"."message_reads" validate constraint "message_reads_message_id_fkey";

alter table "public"."message_reads" add constraint "message_reads_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."message_reads" validate constraint "message_reads_profile_id_fkey";

alter table "public"."messages" add constraint "messages_form_id_fkey" FOREIGN KEY (form_id) REFERENCES public.event_forms(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_form_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."notifications" add constraint "notifications_form_id_fkey" FOREIGN KEY (form_id) REFERENCES public.event_forms(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_form_id_fkey";

alter table "public"."notifications" add constraint "notifications_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_profile_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) not valid;

alter table "public"."profiles" validate constraint "profiles_role_id_fkey";

alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key";

alter table "public"."settings" add constraint "settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."settings" validate constraint "settings_updated_by_fkey";

alter table "public"."signatures" add constraint "signatures_form_id_fkey" FOREIGN KEY (form_id) REFERENCES public.event_forms(id) ON DELETE CASCADE not valid;

alter table "public"."signatures" validate constraint "signatures_form_id_fkey";

alter table "public"."signatures" add constraint "signatures_form_id_workflow_etape_id_key" UNIQUE using index "signatures_form_id_workflow_etape_id_key";

alter table "public"."signatures" add constraint "signatures_signed_by_fkey" FOREIGN KEY (signed_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."signatures" validate constraint "signatures_signed_by_fkey";

alter table "public"."signatures" add constraint "signatures_workflow_etape_id_fkey" FOREIGN KEY (workflow_etape_id) REFERENCES public.workflow_etapes(id) ON DELETE SET NULL not valid;

alter table "public"."signatures" validate constraint "signatures_workflow_etape_id_fkey";

alter table "public"."workflow_etapes" add constraint "workflow_etapes_ordre_key" UNIQUE using index "workflow_etapes_ordre_key";

alter table "public"."workflow_etapes" add constraint "workflow_etapes_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_etapes" validate constraint "workflow_etapes_role_id_fkey";

set check_function_bodies = off;

create or replace view "public"."event_forms_public" as  SELECT id,
    title,
    status,
    event_date,
    event_end_date,
    profile_id
   FROM public.event_forms
  WHERE (status <> 'brouillon'::public.event_status);


CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$select r.name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid()$function$
;

CREATE OR REPLACE FUNCTION public.handle_fiche_soumise()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$begin
  -- Cas 1 : soumission du formulaire (brouillon -> soumise)
  if NEW.status = 'soumise' and OLD.status = 'brouillon' then
    delete from public.signatures 
    where form_id = NEW.id;

    insert into public.signatures (form_id, workflow_etape_id, status, role_label)
    select 
      NEW.id, 
      we.id, 
      'en_attente',
      r.label
    from public.workflow_etapes we
    join public.roles r on r.id = we.role_id
    order by we.ordre;
  end if;

  -- Cas 2 : retour en brouillon (ex : modification admin)
  if NEW.status = 'brouillon' and OLD.status <> 'brouillon' then
    delete from public.signatures 
    where form_id = NEW.id;
  end if;

  return NEW;
end;$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role_id uuid;
  v_role_name text;
begin
  v_role_name := coalesce(new.raw_user_meta_data->>'role', 'club');
  
  select id into v_role_id
  from public.roles
  where name = v_role_name;

  -- Fallback sur 'club' si le rôle n'existe pas
  if v_role_id is null then
    select id into v_role_id from public.roles where name = 'club';
  end if;

  insert into public.profiles (id, email, name, role_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'Nouveau compte'),
    v_role_id
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."event_documents" to "anon";

grant insert on table "public"."event_documents" to "anon";

grant references on table "public"."event_documents" to "anon";

grant select on table "public"."event_documents" to "anon";

grant trigger on table "public"."event_documents" to "anon";

grant truncate on table "public"."event_documents" to "anon";

grant update on table "public"."event_documents" to "anon";

grant delete on table "public"."event_documents" to "authenticated";

grant insert on table "public"."event_documents" to "authenticated";

grant references on table "public"."event_documents" to "authenticated";

grant select on table "public"."event_documents" to "authenticated";

grant trigger on table "public"."event_documents" to "authenticated";

grant truncate on table "public"."event_documents" to "authenticated";

grant update on table "public"."event_documents" to "authenticated";

grant delete on table "public"."event_documents" to "service_role";

grant insert on table "public"."event_documents" to "service_role";

grant references on table "public"."event_documents" to "service_role";

grant select on table "public"."event_documents" to "service_role";

grant trigger on table "public"."event_documents" to "service_role";

grant truncate on table "public"."event_documents" to "service_role";

grant update on table "public"."event_documents" to "service_role";

grant delete on table "public"."event_forms" to "anon";

grant insert on table "public"."event_forms" to "anon";

grant references on table "public"."event_forms" to "anon";

grant select on table "public"."event_forms" to "anon";

grant trigger on table "public"."event_forms" to "anon";

grant truncate on table "public"."event_forms" to "anon";

grant update on table "public"."event_forms" to "anon";

grant delete on table "public"."event_forms" to "authenticated";

grant insert on table "public"."event_forms" to "authenticated";

grant references on table "public"."event_forms" to "authenticated";

grant select on table "public"."event_forms" to "authenticated";

grant trigger on table "public"."event_forms" to "authenticated";

grant truncate on table "public"."event_forms" to "authenticated";

grant update on table "public"."event_forms" to "authenticated";

grant delete on table "public"."event_forms" to "service_role";

grant insert on table "public"."event_forms" to "service_role";

grant references on table "public"."event_forms" to "service_role";

grant select on table "public"."event_forms" to "service_role";

grant trigger on table "public"."event_forms" to "service_role";

grant truncate on table "public"."event_forms" to "service_role";

grant update on table "public"."event_forms" to "service_role";

grant delete on table "public"."message_reads" to "anon";

grant insert on table "public"."message_reads" to "anon";

grant references on table "public"."message_reads" to "anon";

grant select on table "public"."message_reads" to "anon";

grant trigger on table "public"."message_reads" to "anon";

grant truncate on table "public"."message_reads" to "anon";

grant update on table "public"."message_reads" to "anon";

grant delete on table "public"."message_reads" to "authenticated";

grant insert on table "public"."message_reads" to "authenticated";

grant references on table "public"."message_reads" to "authenticated";

grant select on table "public"."message_reads" to "authenticated";

grant trigger on table "public"."message_reads" to "authenticated";

grant truncate on table "public"."message_reads" to "authenticated";

grant update on table "public"."message_reads" to "authenticated";

grant delete on table "public"."message_reads" to "service_role";

grant insert on table "public"."message_reads" to "service_role";

grant references on table "public"."message_reads" to "service_role";

grant select on table "public"."message_reads" to "service_role";

grant trigger on table "public"."message_reads" to "service_role";

grant truncate on table "public"."message_reads" to "service_role";

grant update on table "public"."message_reads" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";

grant delete on table "public"."signatures" to "anon";

grant insert on table "public"."signatures" to "anon";

grant references on table "public"."signatures" to "anon";

grant select on table "public"."signatures" to "anon";

grant trigger on table "public"."signatures" to "anon";

grant truncate on table "public"."signatures" to "anon";

grant update on table "public"."signatures" to "anon";

grant delete on table "public"."signatures" to "authenticated";

grant insert on table "public"."signatures" to "authenticated";

grant references on table "public"."signatures" to "authenticated";

grant select on table "public"."signatures" to "authenticated";

grant trigger on table "public"."signatures" to "authenticated";

grant truncate on table "public"."signatures" to "authenticated";

grant update on table "public"."signatures" to "authenticated";

grant delete on table "public"."signatures" to "service_role";

grant insert on table "public"."signatures" to "service_role";

grant references on table "public"."signatures" to "service_role";

grant select on table "public"."signatures" to "service_role";

grant trigger on table "public"."signatures" to "service_role";

grant truncate on table "public"."signatures" to "service_role";

grant update on table "public"."signatures" to "service_role";

grant delete on table "public"."workflow_etapes" to "anon";

grant insert on table "public"."workflow_etapes" to "anon";

grant references on table "public"."workflow_etapes" to "anon";

grant select on table "public"."workflow_etapes" to "anon";

grant trigger on table "public"."workflow_etapes" to "anon";

grant truncate on table "public"."workflow_etapes" to "anon";

grant update on table "public"."workflow_etapes" to "anon";

grant delete on table "public"."workflow_etapes" to "authenticated";

grant insert on table "public"."workflow_etapes" to "authenticated";

grant references on table "public"."workflow_etapes" to "authenticated";

grant select on table "public"."workflow_etapes" to "authenticated";

grant trigger on table "public"."workflow_etapes" to "authenticated";

grant truncate on table "public"."workflow_etapes" to "authenticated";

grant update on table "public"."workflow_etapes" to "authenticated";

grant delete on table "public"."workflow_etapes" to "service_role";

grant insert on table "public"."workflow_etapes" to "service_role";

grant references on table "public"."workflow_etapes" to "service_role";

grant select on table "public"."workflow_etapes" to "service_role";

grant trigger on table "public"."workflow_etapes" to "service_role";

grant truncate on table "public"."workflow_etapes" to "service_role";

grant update on table "public"."workflow_etapes" to "service_role";


  create policy "Admins voient tous les documents"
  on "public"."event_documents"
  as permissive
  for select
  to public
using ((public.get_my_role() <> 'club'::text));



  create policy "Club uploade ses documents"
  on "public"."event_documents"
  as permissive
  for insert
  to public
with check ((form_id IN ( SELECT event_forms.id
   FROM public.event_forms
  WHERE ((event_forms.profile_id = auth.uid()) AND (event_forms.status = ANY (ARRAY['brouillon'::public.event_status, 'en_revision'::public.event_status]))))));



  create policy "Club voit ses documents"
  on "public"."event_documents"
  as permissive
  for select
  to public
using ((form_id IN ( SELECT event_forms.id
   FROM public.event_forms
  WHERE (event_forms.profile_id = auth.uid()))));



  create policy "Admins modifient les fiches"
  on "public"."event_forms"
  as permissive
  for update
  to public
using ((public.get_my_role() <> 'club'::text));



  create policy "Admins suppriment les fiches"
  on "public"."event_forms"
  as permissive
  for delete
  to public
using ((public.get_my_role() <> 'club'::text));



  create policy "Admins voient les fiches soumises"
  on "public"."event_forms"
  as permissive
  for select
  to public
using (((status <> 'brouillon'::public.event_status) AND (public.get_my_role() <> 'club'::text)));



  create policy "Club crée une fiche"
  on "public"."event_forms"
  as permissive
  for insert
  to public
with check (((profile_id = auth.uid()) AND (public.get_my_role() = 'club'::text)));



  create policy "Club modifie ses fiches éditables"
  on "public"."event_forms"
  as permissive
  for update
  to public
using (((status = ANY (ARRAY['brouillon'::public.event_status, 'en_revision'::public.event_status])) AND (profile_id = auth.uid())))
with check (((status = ANY (ARRAY['brouillon'::public.event_status, 'en_revision'::public.event_status])) AND (profile_id = auth.uid())));



  create policy "Club soumet ses fiches"
  on "public"."event_forms"
  as permissive
  for update
  to public
using (((status = ANY (ARRAY['brouillon'::public.event_status, 'en_revision'::public.event_status])) AND (profile_id = auth.uid())))
with check (((status = 'soumise'::public.event_status) AND (profile_id = auth.uid())));



  create policy "Club supprime ses fiches"
  on "public"."event_forms"
  as permissive
  for delete
  to public
using (((status = ANY (ARRAY['brouillon'::public.event_status, 'en_revision'::public.event_status])) AND (profile_id = auth.uid())));



  create policy "Club voit ses fiches"
  on "public"."event_forms"
  as permissive
  for select
  to public
using ((profile_id = auth.uid()));



  create policy "Direction signe les fiches"
  on "public"."event_forms"
  as permissive
  for update
  to public
using ((public.get_my_role() = 'direction'::text));



  create policy "Insérer ses propres reads"
  on "public"."message_reads"
  as permissive
  for insert
  to public
with check ((profile_id = auth.uid()));



  create policy "Lecture publique des reads"
  on "public"."message_reads"
  as permissive
  for select
  to public
using (true);



  create policy "Admins voient tous les messages"
  on "public"."messages"
  as permissive
  for select
  to public
using ((public.get_my_role() <> 'club'::text));



  create policy "Club voit ses messages"
  on "public"."messages"
  as permissive
  for select
  to public
using ((form_id IN ( SELECT event_forms.id
   FROM public.event_forms
  WHERE (event_forms.profile_id = auth.uid()))));



  create policy "Envoyer un message"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((sender_id = auth.uid()) AND (is_system = false) AND (form_id IN ( SELECT event_forms.id
   FROM public.event_forms
  WHERE (event_forms.status = ANY (ARRAY['soumise'::public.event_status, 'en_revision'::public.event_status, 'validee'::public.event_status, 'refusee'::public.event_status]))))));



  create policy "Créer des notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (true);



  create policy "Marquer notification envoyée"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((profile_id = auth.uid()));



  create policy "Voir ses notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((profile_id = auth.uid()));



  create policy "Admins lisent tous les profils"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((public.get_my_role() <> 'club'::text));



  create policy "Direction peut modifier le role des profils"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((public.get_my_role() = 'direction'::text))
with check ((public.get_my_role() = 'direction'::text));



  create policy "Lire son propre profil"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Un utilisateur peut lire les profils des participants d'une con"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((id IN ( SELECT messages.sender_id
   FROM public.messages
  WHERE (messages.form_id IN ( SELECT event_forms.id
           FROM public.event_forms
          WHERE (event_forms.profile_id = auth.uid()))))));



  create policy "Un utilisateur peut modifier son propre profil"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Direction peut ajouter des roles"
  on "public"."roles"
  as permissive
  for insert
  to public
with check ((public.get_my_role() = 'direction'::text));



  create policy "Direction peut supprimer des roles"
  on "public"."roles"
  as permissive
  for delete
  to public
using ((public.get_my_role() = 'direction'::text));



  create policy "Tout le monde lit les roles"
  on "public"."roles"
  as permissive
  for select
  to public
using (true);



  create policy "Direction peut modifier les settings"
  on "public"."settings"
  as permissive
  for update
  to public
using ((public.get_my_role() = 'direction'::text));



  create policy "Tout le monde peut lire les settings"
  on "public"."settings"
  as permissive
  for select
  to public
using (true);



  create policy "Direction peut supprimer des signature"
  on "public"."signatures"
  as permissive
  for delete
  to public
using ((public.get_my_role() = 'direction'::text));



  create policy "Signataire peut signer son étape"
  on "public"."signatures"
  as permissive
  for update
  to public
using (((workflow_etape_id IN ( SELECT we.id
   FROM ((public.workflow_etapes we
     JOIN public.roles r ON ((r.id = we.role_id)))
     JOIN public.profiles p ON ((p.role_id = r.id)))
  WHERE (p.id = auth.uid()))) AND (status = 'en_attente'::text)))
with check ((workflow_etape_id IN ( SELECT we.id
   FROM ((public.workflow_etapes we
     JOIN public.roles r ON ((r.id = we.role_id)))
     JOIN public.profiles p ON ((p.role_id = r.id)))
  WHERE (p.id = auth.uid()))));



  create policy "Tout le monde lit les signatures"
  on "public"."signatures"
  as permissive
  for select
  to public
using (true);



  create policy "Direction gère le workflow"
  on "public"."workflow_etapes"
  as permissive
  for all
  to public
using ((public.get_my_role() = 'direction'::text));



  create policy "Tout le monde lit le workflow"
  on "public"."workflow_etapes"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER on_fiche_soumise AFTER UPDATE ON public.event_forms FOR EACH ROW EXECUTE FUNCTION public.handle_fiche_soumise();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Admins lisent les documents publics"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'public-ressources'::text) AND (public.get_my_role() <> 'club'::text)));



  create policy "Admins lisent tous les documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'event-documents'::text) AND (public.get_my_role() <> 'club'::text)));



  create policy "Admins mettent a jour des documents publics"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'public-ressources'::text) AND (public.get_my_role() <> 'club'::text)));



  create policy "Admins suppriment des documents publics"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'public-ressources'::text) AND (public.get_my_role() <> 'club'::text)));



  create policy "Admins suppriment tous les documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'event-documents'::text) AND (public.get_my_role() <> 'club'::text)));



  create policy "Admins uploadent des documents publics"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'public-ressources'::text) AND (public.get_my_role() <> 'club'::text)));



  create policy "Club lit ses documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'event-documents'::text) AND (auth.uid() IN ( SELECT ef.profile_id
   FROM public.event_forms ef
  WHERE ((ef.id)::text = (storage.foldername(objects.name))[1])))));



  create policy "Club supprime ses documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'event-documents'::text) AND (auth.uid() IN ( SELECT ef.profile_id
   FROM public.event_forms ef
  WHERE ((ef.id)::text = (storage.foldername(objects.name))[1])))));



  create policy "Club upload ses documents"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'event-documents'::text) AND (auth.uid() IN ( SELECT ef.profile_id
   FROM public.event_forms ef
  WHERE ((ef.id)::text = (storage.foldername(objects.name))[1])))));



  create policy "Clubs lisent les documents publics"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'public-ressources'::text) AND (public.get_my_role() = 'club'::text)));



