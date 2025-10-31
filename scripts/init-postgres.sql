-- PostgreSQL 초기화 스크립트
-- MindBuddy 심리상담 플랫폼 데이터베이스 설정

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 데이터베이스 생성 (이미 존재하는 경우 무시)
SELECT 'CREATE DATABASE mindbuddy'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindbuddy')\gexec

-- 마이크로서비스별 데이터베이스 생성
SELECT 'CREATE DATABASE mindbuddy_auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindbuddy_auth')\gexec

SELECT 'CREATE DATABASE mindbuddy_booking'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindbuddy_booking')\gexec

SELECT 'CREATE DATABASE mindbuddy_notification'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindbuddy_notification')\gexec

SELECT 'CREATE DATABASE mindbuddy_payment'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindbuddy_payment')\gexec

SELECT 'CREATE DATABASE mindbuddy_counselor'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindbuddy_counselor')\gexec

SELECT 'CREATE DATABASE mindbuddy_ai'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindbuddy_ai')\gexec

-- 사용자 역할 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mindbuddy_user') THEN
        CREATE ROLE mindbuddy_user WITH LOGIN PASSWORD 'mindbuddy_password';
    END IF;
END
$$;

-- 권한 부여
GRANT CONNECT ON DATABASE mindbuddy TO mindbuddy_user;
GRANT CONNECT ON DATABASE mindbuddy_auth TO mindbuddy_user;
GRANT CONNECT ON DATABASE mindbuddy_booking TO mindbuddy_user;
GRANT CONNECT ON DATABASE mindbuddy_notification TO mindbuddy_user;
GRANT CONNECT ON DATABASE mindbuddy_payment TO mindbuddy_user;
GRANT CONNECT ON DATABASE mindbuddy_counselor TO mindbuddy_user;
GRANT CONNECT ON DATABASE mindbuddy_ai TO mindbuddy_user;

-- 기본 데이터베이스 연결
\c mindbuddy;

-- ENUM 타입 생성
CREATE TYPE user_role AS ENUM ('client', 'counselor', 'admin');
CREATE TYPE counselor_license AS ENUM ('clinical', 'counseling', 'social', 'other');
CREATE TYPE counselor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE booking_method AS ENUM ('video', 'voice', 'chat');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'paypal');
CREATE TYPE notification_type AS ENUM (
  'booking_confirmed', 'booking_cancelled', 'booking_reminder',
  'session_started', 'session_ended', 'message_received',
  'review_received', 'payment_completed', 'system_announcement'
);
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
CREATE TYPE concern_type AS ENUM ('depression', 'anxiety', 'trauma', 'relationship', 'family', 'work', 'self-esteem', 'other');
CREATE TYPE specialty_type AS ENUM ('depression', 'anxiety', 'trauma', 'relationship', 'family', 'couple', 'child', 'addiction');
CREATE TYPE preferred_method AS ENUM ('video', 'voice', 'chat', 'all');
CREATE TYPE preferred_gender AS ENUM ('male', 'female', 'any');

-- 성능 최적화를 위한 설정
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- 연결 풀 최적화
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- 로깅 설정
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- 백업 및 복구 설정
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /var/lib/postgresql/archive/%f';

COMMENT ON DATABASE mindbuddy IS 'MindBuddy 심리상담 플랫폼 메인 데이터베이스';

-- 초기 관리자 계정 생성을 위한 함수
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
BEGIN
    -- 이 함수는 애플리케이션 시작 시 실행됩니다
    RAISE NOTICE '관리자 계정은 애플리케이션을 통해 생성됩니다';
END;
$$ LANGUAGE plpgsql;