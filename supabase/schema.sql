-- =====================================================
-- STARGENIUS - SUPABASE SCHEMA
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STUDENTS TABLE (sync from CEO Junior)
-- =====================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    date_of_birth DATE,
    code VARCHAR(20) NOT NULL,
    family_id VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_external_id ON students(external_id);
CREATE INDEX idx_students_family_id ON students(family_id);

-- =====================================================
-- GENIUSES & CONTENT
-- =====================================================
CREATE TABLE geniuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    era VARCHAR(100),
    field VARCHAR(255) NOT NULL,
    field_verified BOOLEAN DEFAULT FALSE,
    description TEXT,
    portrait_url TEXT,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_lessons INTEGER DEFAULT 0,
    total_genius INTEGER DEFAULT 0,
    total_inspired INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geniuses_slug ON geniuses(slug);
CREATE INDEX idx_geniuses_published ON geniuses(is_published);
CREATE INDEX idx_geniuses_tags ON geniuses USING GIN (tags);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    genius_id UUID REFERENCES geniuses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    lesson_number INTEGER NOT NULL,
    key_phrase TEXT NOT NULL,
    video_url TEXT NOT NULL,
    video_thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 45,
    audio_track_name TEXT,
    intelligence_type VARCHAR(50) NOT NULL,
    genius_count INTEGER DEFAULT 0,
    inspired_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_genius ON lessons(genius_id);
CREATE INDEX idx_lessons_intelligence ON lessons(intelligence_type);
CREATE INDEX idx_lessons_trending ON lessons(inspired_count DESC, genius_count DESC);

-- =====================================================
-- INTELLIGENCES (7 Types)
-- =====================================================
CREATE TABLE intelligences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    order_index INTEGER NOT NULL
);

INSERT INTO intelligences (code, name, description, icon, color, order_index) VALUES
('mental', 'Mental', 'Lógica, análisis y pensamiento crítico', 'psychology', '#a78bfa', 1),
('emocional', 'Emocional', 'Inteligencia emocional y autoconocimiento', 'favorite', '#dc79a8', 2),
('social', 'Social', 'Habilidades interpersonales y liderazgo', 'groups', '#60a5fa', 3),
('financiera', 'Financiera', 'Educación financiera y negocios', 'savings', '#34d399', 4),
('creativa', 'Creativa', 'Innovación y pensamiento divergente', 'palette', '#fbbf24', 5),
('fisica', 'Física', 'Salud, energía y bienestar', 'fitness_center', '#fb923c', 6),
('espiritual', 'Espiritual', 'Propósito, valores y trascendencia', 'spa', '#c084fc', 7);

-- =====================================================
-- STUDENT INTERACTIONS
-- =====================================================
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- genius, inspired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id, type)
);

CREATE INDEX idx_reactions_student ON reactions(student_id);
CREATE INDEX idx_reactions_lesson ON reactions(lesson_id);

CREATE TABLE bookmarks (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, lesson_id)
);

CREATE INDEX idx_bookmarks_student ON bookmarks(student_id);

CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    share_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shares_lesson ON shares(lesson_id);

-- =====================================================
-- LEARNING PROGRESS
-- =====================================================
CREATE TABLE genius_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    genius_id UUID REFERENCES geniuses(id) ON DELETE CASCADE,
    ideas_viewed INTEGER DEFAULT 0,
    ideas_completed INTEGER DEFAULT 0,
    progress_percent INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'reading',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, genius_id)
);

CREATE INDEX idx_genius_progress_student ON genius_progress(student_id);
CREATE INDEX idx_genius_progress_status ON genius_progress(status);

CREATE TABLE lesson_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    watch_time_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_position_seconds INTEGER DEFAULT 0,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

CREATE INDEX idx_lesson_views_student ON lesson_views(student_id);
CREATE INDEX idx_lesson_views_lesson ON lesson_views(lesson_id);

-- =====================================================
-- PLAYLISTS
-- =====================================================
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_color VARCHAR(20) DEFAULT '#06b6d4',
    is_public BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_student ON playlists(student_id);

CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playlist_id, lesson_id)
);

CREATE INDEX idx_playlist_items_playlist ON playlist_items(playlist_id);

-- =====================================================
-- COLLECTIONS (Curated by admins)
-- =====================================================
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cover_url TEXT,
    gradient_from VARCHAR(20) DEFAULT '#06b6d4',
    gradient_to VARCHAR(20) DEFAULT '#0891b2',
    order_index INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_geniuses (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    genius_id UUID REFERENCES geniuses(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    PRIMARY KEY (collection_id, genius_id)
);

-- =====================================================
-- REFLECTIONS (Personal Notes)
-- =====================================================
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_student ON reflections(student_id);

-- =====================================================
-- SEARCH HISTORY
-- =====================================================
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_history_student ON search_history(student_id);
CREATE INDEX idx_search_history_date ON search_history(searched_at DESC);

-- =====================================================
-- STUDENT INTELLIGENCE PROFILE
-- =====================================================
CREATE TABLE student_intelligences (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    intelligence_code VARCHAR(50) REFERENCES intelligences(code),
    score INTEGER DEFAULT 0,
    ideas_consumed INTEGER DEFAULT 0,
    PRIMARY KEY (student_id, intelligence_code)
);

CREATE INDEX idx_student_intelligences_student ON student_intelligences(student_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update lesson reaction counts
CREATE OR REPLACE FUNCTION update_lesson_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'genius' THEN
            UPDATE lessons SET genius_count = genius_count + 1 WHERE id = NEW.lesson_id;
        ELSIF NEW.type = 'inspired' THEN
            UPDATE lessons SET inspired_count = inspired_count + 1 WHERE id = NEW.lesson_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'genius' THEN
            UPDATE lessons SET genius_count = genius_count - 1 WHERE id = OLD.lesson_id;
        ELSIF OLD.type = 'inspired' THEN
            UPDATE lessons SET inspired_count = inspired_count - 1 WHERE id = OLD.lesson_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reactions_count_trigger
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_reaction_counts();

-- Update lesson bookmark counts
CREATE OR REPLACE FUNCTION update_lesson_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lessons SET save_count = save_count + 1 WHERE id = NEW.lesson_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lessons SET save_count = save_count - 1 WHERE id = OLD.lesson_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookmarks_count_trigger
    AFTER INSERT OR DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_bookmark_count();

-- Update genius progress when lesson is viewed
CREATE OR REPLACE FUNCTION update_genius_progress_on_view()
RETURNS TRIGGER AS $$
DECLARE
    genius_id_var UUID;
    total_lessons INTEGER;
    completed_lessons INTEGER;
BEGIN
    SELECT l.genius_id INTO genius_id_var FROM lessons l WHERE l.id = NEW.lesson_id;
    SELECT COUNT(*) INTO total_lessons FROM lessons WHERE genius_id = genius_id_var;
    SELECT COUNT(*) INTO completed_lessons
    FROM lesson_views lv
    JOIN lessons l ON lv.lesson_id = l.id
    WHERE lv.student_id = NEW.student_id
    AND l.genius_id = genius_id_var
    AND lv.completed = TRUE;

    INSERT INTO genius_progress (student_id, genius_id, ideas_completed, progress_percent, last_viewed_at)
    VALUES (
        NEW.student_id,
        genius_id_var,
        completed_lessons,
        CASE WHEN total_lessons > 0 THEN (completed_lessons * 100 / total_lessons) ELSE 0 END,
        NOW()
    )
    ON CONFLICT (student_id, genius_id)
    DO UPDATE SET
        ideas_completed = completed_lessons,
        progress_percent = CASE WHEN total_lessons > 0 THEN (completed_lessons * 100 / total_lessons) ELSE 0 END,
        last_viewed_at = NOW(),
        completed_at = CASE WHEN completed_lessons >= total_lessons THEN NOW() ELSE genius_progress.completed_at END,
        status = CASE WHEN completed_lessons >= total_lessons THEN 'completed' ELSE 'reading' END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_views_update_progress
    AFTER INSERT OR UPDATE ON lesson_views
    FOR EACH ROW
    EXECUTE FUNCTION update_genius_progress_on_view();

-- Update student intelligence scores
CREATE OR REPLACE FUNCTION update_student_intelligence_score()
RETURNS TRIGGER AS $$
DECLARE
    intelligence_type_var VARCHAR(50);
BEGIN
    -- Solo procesar si es INSERT con completed=true, o UPDATE donde completed cambió a true
    IF TG_OP = 'UPDATE' AND OLD.completed = TRUE THEN
        RETURN NEW; -- Ya se contó anteriormente
    END IF;

    SELECT intelligence_type INTO intelligence_type_var FROM lessons WHERE id = NEW.lesson_id;

    INSERT INTO student_intelligences (student_id, intelligence_code, ideas_consumed, score)
    VALUES (NEW.student_id, intelligence_type_var, 1, 10)
    ON CONFLICT (student_id, intelligence_code)
    DO UPDATE SET
        ideas_consumed = student_intelligences.ideas_consumed + 1,
        score = LEAST(100, student_intelligences.score + 5);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_views_update_intelligence
    AFTER INSERT OR UPDATE ON lesson_views
    FOR EACH ROW
    WHEN (NEW.completed = TRUE)
    EXECUTE FUNCTION update_student_intelligence_score();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reflections_updated_at
    BEFORE UPDATE ON reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update genius total_lessons when lessons are added/removed
CREATE OR REPLACE FUNCTION update_genius_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE geniuses SET total_lessons = (
            SELECT COUNT(*) FROM lessons WHERE genius_id = NEW.genius_id
        ) WHERE id = NEW.genius_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE geniuses SET total_lessons = (
            SELECT COUNT(*) FROM lessons WHERE genius_id = OLD.genius_id
        ) WHERE id = OLD.genius_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lessons_count_trigger
    AFTER INSERT OR DELETE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_genius_lessons_count();

-- Update genius aggregate stats when reactions/bookmarks change
CREATE OR REPLACE FUNCTION update_genius_reaction_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    v_genius_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT genius_id INTO v_genius_id FROM lessons WHERE id = NEW.lesson_id;
    ELSE
        SELECT genius_id INTO v_genius_id FROM lessons WHERE id = OLD.lesson_id;
    END IF;

    UPDATE geniuses SET
        total_genius = COALESCE((SELECT SUM(genius_count) FROM lessons WHERE genius_id = v_genius_id), 0),
        total_inspired = COALESCE((SELECT SUM(inspired_count) FROM lessons WHERE genius_id = v_genius_id), 0),
        total_saves = COALESCE((SELECT SUM(save_count) FROM lessons WHERE genius_id = v_genius_id), 0)
    WHERE id = v_genius_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER genius_reaction_aggregates_trigger
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_genius_reaction_aggregates();

CREATE TRIGGER genius_bookmark_aggregates_trigger
    AFTER INSERT OR DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_genius_reaction_aggregates();

-- =====================================================
-- NOTIFICATIONS (broadcast from admin)
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL DEFAULT 'new_lesson',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE notification_reads (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, notification_id)
);

CREATE INDEX idx_notification_reads_student ON notification_reads(student_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE geniuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE genius_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_intelligences ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_geniuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API routes using service key)
CREATE POLICY "Service role full access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON geniuses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON bookmarks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON genius_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON lesson_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON playlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON playlist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reflections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON search_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON student_intelligences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON collection_geniuses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intelligences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON shares FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notification_reads FOR ALL USING (true) WITH CHECK (true);
