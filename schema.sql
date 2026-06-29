-- =====================================================
-- ADF - Arafat Digital Futurist - Complete Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
        CREATE TYPE role_enum AS ENUM ('user', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
        CREATE TYPE order_status_enum AS ENUM ('pending', 'approved', 'rejected', 'invoiced', 'paid', 'sample_sent', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type_enum') THEN
        CREATE TYPE product_type_enum AS ENUM ('digital', 'template', 'ebook', 'software', 'course', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('pending', 'proof_sent', 'approved', 'rejected');
    END IF;
END$$;

-- ====================================================
-- PROFILES (linked to Supabase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role role_enum DEFAULT 'user' NOT NULL,
    ai_message_limit INTEGER DEFAULT 50,
    ai_messages_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI CONFIGURATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_configs (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL UNIQUE,
    api_key TEXT,
    base_url TEXT,
    model VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    instructions TEXT DEFAULT 'Tu es ADF IA, l''assistant intelligent d''Arafat Digital Futurist. Tu aides les utilisateurs avec les services digitaux, les commandes, et les produits. Réponds en français de manière professionnelle et amicale.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT SESSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Nouvelle conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    base_price DECIMAL(10, 2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SERVICE ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    status order_status_enum DEFAULT 'pending' NOT NULL,
    price DECIMAL(10, 2),
    admin_notes TEXT,
    sample_url TEXT,
    final_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORDER MESSAGES (chat per order)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENT METHODS
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    details JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type product_type_enum DEFAULT 'digital' NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_urls JSONB DEFAULT '[]',
    file_urls JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCT ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS product_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    status payment_status_enum DEFAULT 'pending' NOT NULL,
    proof_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCT ORDER MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS product_order_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_order_id UUID REFERENCES product_orders(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat sessions RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions" 
    ON chat_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" 
    ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" 
    ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- Chat messages RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own sessions" 
    ON chat_messages FOR SELECT USING (
        EXISTS (SELECT 1 FROM chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert messages to own sessions" 
    ON chat_messages FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid())
    );

-- Service orders RLS
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" 
    ON service_orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" 
    ON service_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order messages RLS
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own orders" 
    ON order_messages FOR SELECT USING (
        EXISTS (SELECT 1 FROM service_orders WHERE id = order_messages.order_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert messages to own orders" 
    ON order_messages FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM service_orders WHERE id = order_messages.order_id AND user_id = auth.uid())
    );

-- Product orders RLS
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product orders" 
    ON product_orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product orders" 
    ON product_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Product order messages RLS
ALTER TABLE product_order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own product orders" 
    ON product_order_messages FOR SELECT USING (
        EXISTS (SELECT 1 FROM product_orders WHERE id = product_order_messages.product_order_id AND user_id = auth.uid())
    );

-- Services (public read)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are viewable by everyone" 
    ON services FOR SELECT USING (true);

-- Products (public read)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" 
    ON products FOR SELECT USING (true);

-- Payment methods (public read)
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment methods are viewable by everyone" 
    ON payment_methods FOR SELECT USING (true);

-- AI configs (admin only write, public read)
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI configs viewable by everyone" 
    ON ai_configs FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
        CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'chat_sessions_updated_at') THEN
        CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'service_orders_updated_at') THEN
        CREATE TRIGGER service_orders_updated_at BEFORE UPDATE ON service_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'product_orders_updated_at') THEN
        CREATE TRIGGER product_orders_updated_at BEFORE UPDATE ON product_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ai_configs_updated_at') THEN
        CREATE TRIGGER ai_configs_updated_at BEFORE UPDATE ON ai_configs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE WHEN NEW.email = 'admin@adf.com' THEN 'admin' ELSE 'user' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default services
INSERT INTO services (name, description, category, base_price, is_active) VALUES
('Logo Professionnel', 'Création d''un logo unique et mémorable pour votre marque', 'Design Graphique', 25000, true),
('Carte de Visite', 'Design élégant et professionnel de cartes de visite', 'Design Graphique', 15000, true),
('Flyer / Affiche', 'Communication visuelle impactante pour vos événements', 'Design Graphique', 20000, true),
('Charte Graphique', 'Identité visuelle complète de votre marque', 'Identité Visuelle', 75000, true),
('Packaging Design', 'Design d''emballage professionnel', 'Identité Visuelle', 50000, true),
('Site Vitrine', 'Site web professionnel et responsive', 'Développement Web', 150000, true),
('E-commerce', 'Boutique en ligne complète avec paiement', 'Développement Web', 300000, true),
('Application Web', 'Application web sur mesure', 'Développement Web', 500000, true),
('App Android', 'Application native Android', 'Applications Mobiles', 400000, true),
('App iOS', 'Application native iOS', 'Applications Mobiles', 500000, true),
('Vidéo Promotionnelle', 'Vidéo marketing professionnelle', 'Montage Vidéo', 50000, true),
('Motion Design', 'Animations dynamiques et attractives', 'Montage Vidéo', 75000, true),
('Contenu Web', 'Rédaction SEO optimisée', 'Rédaction', 10000, true),
('Copywriting', 'Textes persuasifs pour conversion', 'Rédaction', 15000, true)
ON CONFLICT DO NOTHING;

-- Insert default AI configs
INSERT INTO ai_configs (provider, api_key, base_url, model, is_active, instructions) VALUES
('gemini', NULL, 'https://generativelanguage.googleapis.com', 'gemini-1.5-flash', false, 'Tu es ADF IA, l''assistant intelligent d''Arafat Digital Futurist. Tu aides les utilisateurs avec les services digitaux, les commandes, et les produits. Réponds en français de manière professionnelle et amicale.'),
('openai', NULL, 'https://api.openai.com', 'gpt-3.5-turbo', false, 'Tu es ADF IA, l''assistant intelligent d''Arafat Digital Futurist. Tu aides les utilisateurs avec les services digitaux, les commandes, et les produits. Réponds en français de manière professionnelle et amicale.'),
('claude', NULL, 'https://api.anthropic.com', 'claude-3-haiku', false, 'Tu es ADF IA, l''assistant intelligent d''Arafat Digital Futurist. Tu aides les utilisateurs avec les services digitaux, les commandes, et les produits. Réponds en français de manière professionnelle et amicale.'),
('grok', NULL, 'https://api.x.ai', 'grok-beta', false, 'Tu es ADF IA, l''assistant intelligent d''Arafat Digital Futurist. Tu aides les utilisateurs avec les services digitaux, les commandes, et les produits. Réponds en français de manière professionnelle et amicale.')
ON CONFLICT (provider) DO NOTHING;

-- Insert default payment methods
INSERT INTO payment_methods (name, type, details, is_active) VALUES
('Orange Money', 'om', '{"number": "+237 6XX XXX XXX", "holder": "ADF SARL"}', true),
('Mobile Money', 'momo', '{"number": "+237 6XX XXX XXX", "holder": "ADF SARL"}', true),
('PayPal', 'paypal', '{"email": "payments@adf.com", "holder": "ADF SARL"}', true),
('Carte Bancaire', 'card', '{"number": "**** **** **** ****", "holder": "ADF SARL", "bank": "Bank Name"}', true)
ON CONFLICT DO NOTHING;

-- Insert default products
INSERT INTO products (name, description, type, price, image_urls, file_urls, is_active) VALUES
('Pack 50 Templates Canva', 'Templates professionnels pour réseaux sociaux, stories et posts', 'template', 15000, '[]', '[]', true),
('E-book Marketing Digital', 'Guide complet du marketing digital en Afrique francophone', 'ebook', 10000, '[]', '[]', true),
('Pack Icônes Premium', '500 icônes SVG vectorielles pour vos projets web et mobile', 'digital', 8000, '[]', '[]', true),
('Template Site Portfolio', 'Template HTML/CSS responsive et moderne', 'template', 25000, '[]', '[]', true),
('Cours Design UI/UX', 'Formation complète en design d''interface utilisateur', 'course', 50000, '[]', '[]', true),
('Pack Fonts Professionnelles', '100 polices de caractères premium pour designers', 'digital', 12000, '[]', '[]', true),
('Kit UI Mobile', 'Composants UI prêts à l''emploi pour apps mobiles', 'template', 35000, '[]', '[]', true),
('E-book Freelance Pro', 'Guide pour devenir freelance digital prospère', 'ebook', 15000, '[]', '[]', true)
ON CONFLICT DO NOTHING;
