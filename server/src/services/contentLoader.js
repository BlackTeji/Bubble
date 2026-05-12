import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../../../content/courses');

const readJSON = async (filepath) => {
    const text = await readFile(filepath, 'utf8');
    return JSON.parse(text);
};

const upsertCourse = async (courseData) => {
    const { rows } = await query(
        `INSERT INTO courses (slug, title, description, difficulty, order_index, is_published)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       is_published = EXCLUDED.is_published
     RETURNING id`,
        [courseData.slug, courseData.title, courseData.description,
        courseData.difficulty ?? 'beginner', courseData.orderIndex ?? 0, courseData.published ?? false]
    );
    return rows[0].id;
};

const upsertPath = async (courseId, pathData, orderIndex) => {
    const { rows } = await query(
        `INSERT INTO learning_paths (course_id, slug, title, description, order_index)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (course_id, slug) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       order_index = EXCLUDED.order_index
     RETURNING id`,
        [courseId, pathData.slug, pathData.title, pathData.description ?? '', orderIndex]
    );
    return rows[0].id;
};

const upsertLesson = async (pathId, lessonData, orderIndex) => {
    await query(
        `INSERT INTO lessons (path_id, slug, title, type, content_json, xp_reward, order_index, estimated_mins)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (path_id, slug) DO UPDATE SET
       title       = EXCLUDED.title,
       type        = EXCLUDED.type,
       content_json = EXCLUDED.content_json,
       xp_reward   = EXCLUDED.xp_reward,
       estimated_mins = EXCLUDED.estimated_mins`,
        [pathId, lessonData.slug, lessonData.title, lessonData.type ?? 'concept',
            JSON.stringify(lessonData.content), lessonData.xpReward ?? 10, orderIndex, lessonData.estimatedMins ?? 5]
    );
};

export const loadContent = async () => {
    const courseDirs = await readdir(CONTENT_DIR);

    for (const courseDir of courseDirs) {
        const coursePath = join(CONTENT_DIR, courseDir);
        const courseData = await readJSON(join(coursePath, 'course.json'));

        console.log(`[content] Loading course: ${courseData.slug}`);
        const courseId = await upsertCourse(courseData);

        const pathsDir = join(coursePath, 'paths');
        let pathDirs;
        try {
            pathDirs = (await readdir(pathsDir)).sort();
        } catch {
            continue;
        }

        for (let pi = 0; pi < pathDirs.length; pi++) {
            const pathDir = join(pathsDir, pathDirs[pi]);
            const pathData = await readJSON(join(pathDir, 'path.json'));

            const pathId = await upsertPath(courseId, pathData, pi);

            const lessonFiles = (await readdir(pathDir))
                .filter(f => f.endsWith('.json') && f !== 'path.json')
                .sort();

            for (let li = 0; li < lessonFiles.length; li++) {
                const lessonData = await readJSON(join(pathDir, lessonFiles[li]));
                await upsertLesson(pathId, lessonData, li);
                console.log(`[content]   Loaded lesson: ${lessonData.slug}`);
            }
        }
    }

    console.log('[content] Content sync complete.');
};