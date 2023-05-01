// CREATE TABLE user_permission (
//   id INTEGER PRIMARY KEY,

//   permission TEXT NOT NULL,
//   readable INTEGER NOT NULL,
//   writable INTEGER NOT NULL,
//   deletable INTEGER NOT NULL, 

//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL
// );

// CREATE TABLE users (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   user_permission_id INTEGER NOT NULL,
//   name TEXT NOT NULL,
//   password TEXT NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL,
//   FOREIGN KEY (user_permission_id) REFERENCES user_permission(id)
// );

// CREATE TABLE dups_parent (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//     user_id INTEGER NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL,
//     FOREIGN KEY (user_id) REFERENCES users(id)
// );


// CREATE TABLE dups (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   dups_parent_id INTEGER NOT NULL,
//   content TEXT NOT NULL,
//     FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
// );

// CREATE TABLE likes (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     dups_parent_id INTEGER NOT NULL,
//     user_id INTEGER NOT NULL,
//     created_at DATETIME NOT NULL,
//     updated_at DATETIME NOT NULL,
//     FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
// );

// INSERT INTO user_permission (id, permission, readable, writable, deletable, created_at, updated_at) VALUES (1, 'guest', 1, 0, 0, DATETIME('now'), DATETIME('now'));
// INSERT INTO user_permission (id, permission, readable, writable, deletable, created_at, updated_at) VALUES (2, 'user', 1, 1, 1, DATETIME('now'), DATETIME('now'));

// INSERT INTO users (user_permission_id, name, password, created_at, updated_at) VALUES (1, 'GUEST', 'GUEST_PASS', DATETIME('now'), DATETIME('now'));
// INSERT INTO users (user_permission_id, name, password, created_at, updated_at) VALUES (2, 'name1', 'password1', DATETIME('now'), DATETIME('now'));
// INSERT INTO users (user_permission_id, name, password, created_at, updated_at) VALUES (2, 'name2', 'password2', DATETIME('now'), DATETIME('now'));


const R = require('ramda');
const express = require('express');
const sqlite = require('better-sqlite3');
const db = new sqlite('./dup.sqlite3');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors());
const port = 8000;
app.listen(port, "0.0.0.0", () => console.log(`App listening!! at http://localhost:${port}`) );

const now = () => new Date().toISOString();
const true_if_within_4000_characters_and_not_empty = (str) => str.length > 2 && str.length <= 4000 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false;
const true_if_within_10_characters_and_not_empty = (str) => str.length > 2 && str.length <= 10 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false;

// '/read_dups_parent'というGETのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsとそれを紐づけるuserを取得する。
// それらの全てのidとcontent1とcontent2とcontent3を返すとcreated_atとupdated_atとuserのnameを返す
// dups_parentのlike数も返す、dups_parentに紐づくtagも返す
// 原因不明のエラーの場合は適当なエラーレスポンスを返す
app.get('/read_dups_parent', (req, res) => {
    try {
    const rows = db.prepare(
    `SELECT
    dups_parent.id AS dups_parent_id,
    dups_parent.created_at AS dups_parent_created_at,
    dups_parent.updated_at AS dups_parent_updated_at,
    users.username AS user_name,
    dups.content_group_id AS dups_content_group_id,
    dups.content_1 AS dups_content_1,
    dups.content_2 AS dups_content_2,
    dups.content_3 AS dups_content_3,
    (SELECT COUNT(*)
        FROM likes
            WHERE likes.dups_parent_id = dups_parent.id) AS likes_count
    FROM dups_parent LEFT JOIN users ON dups_parent.user_id = users.id
    LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
    `).all();


    // 下記のget_tagsとgroupByは間違ったコードだが他の書き方がわからないのでとりあえずこれで動かす
    const get_tags = (dups_parent_id) => db.prepare(
        `SELECT
        GROUP_CONCAT(tags.tag) AS tags
        FROM dups_parent
        JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
        JOIN tags ON dups_parent_tags.tag_id = tags.id
        WHERE dups_parent.id = ?
    `).all(dups_parent_id);

    function groupBy(array, key) {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(
                currentValue
            );
            return result;
        }, {});
    };

    const new_rows = rows.map(item => {
        return {
            ...item, // 元のオブジェクトを展開
            tags: get_tags(item.dups_parent_id) // dups_parent_idを追加
        }
    });

    const group_rows = groupBy(new_rows, 'dups_parent_id');

    res.json(group_rows);
    } catch (error) {
        console.log(error);
        error_response(res,
            '原因不明のエラー' + error);
    }
});


// expressの一般的なエラーのレスポンス。引数としてエラー文字列を含めて呼び出す
const error_response = (res, error_message) => res.status(400).json({ error: error_message });

// '/insert_dup'というPOSTのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsを作成する。
app.post('/insert_dup', (req, res) => {
    // console.log(req.body.B_C_list);
    try {
    req.body.B_C_list.forEach((EACH_CONTENT) => {
        true_if_within_4000_characters_and_not_empty(EACH_CONTENT.join("")) ? null : error_response(res, '4000文字以内で入力して');
    });
    const user_with_permission = db.prepare(`
        SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission,
        user_permission.deletable AS deletable,
        user_permission.writable AS writable,
        user_permission.readable AS readable,
        user_permission.likable AS likable
        FROM users
        LEFT JOIN user_permission ON users.user_permission_id = user_permission.id
        WHERE users.username = ? AND users.userpassword = ?
    `).get(req.body.name, req.body.password);
    user_with_permission ? null : error_response(res, 'ユーザーが存在しません');
    // console.log(user_with_permission);
    user_with_permission.writable === 1 ? null : error_response(res, '書き込み権限がありません');
    db.prepare('INSERT INTO dups_parent (user_id, created_at, updated_at) VALUES (?, ?, ?)').run(user_with_permission.user_id, now(), now()) ? null : error_response(res, 'dups_parentに追加できませんでした');
    const dups_parent_id = db.prepare('SELECT id FROM dups_parent ORDER BY id DESC LIMIT 1').get().id;
    console.log(dups_parent_id);
    req.body.B_C_list.forEach((EACH_CONTENT, CONTENT_GROUP_ID) => {
        console.log(EACH_CONTENT);
        db.prepare('INSERT INTO dups (dups_parent_id, content_group_id, content_1, content_2, content_3) VALUES (?, ?, ?, ?, ?)')
            .run(dups_parent_id, CONTENT_GROUP_ID, EACH_CONTENT[0], EACH_CONTENT[1], EACH_CONTENT[2]) ? null : error_response(res, 'dupsに追加できませんでした');

    });

    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});
// '/delete_dup'というPOSTのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsを削除する。
// error_responseを使ってエラーを返すパターンとしては、
// 1. ユーザーが存在しません
// 2. 削除権限がありません
// 3. dupsを削除できませんでした
// 4. dups_parentを削除できませんでした
// 原因不明のエラーの場合は適当なエラーレスポンスを返す
app.post('/delete_dup', (req, res) => {
    try {
    const user_with_permission = db.prepare('SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission FROM users LEFT JOIN user_permission ON users.user_permission_id = user_permission.id WHERE users.username = ? AND users.userpassword = ?').get(req.body.name, req.body.password) ? null : error_response(res, 'ユーザーが存在しません');
    user_with_permission.deletable === 1 ? null : error_response(res, '削除権限がありません');
    db.prepare('DELETE FROM dups WHERE dups_parent_id = ?').run(req.body.dups_parent_id) ? null : error_response(res, 'dupsを削除できませんでした');
    db.prepare('DELETE FROM dups_parent WHERE id = ?').run(req.body.dups_parent_id) ? null : error_response(res, 'dups_parentを削除できませんでした');
    res.json({message: 'success'});

    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});
// delete_all_dups_and_dups_parentというPOSTのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsを全て削除する。
app.post('/delete_all_dups_and_dups_parent', (req, res) => {
    try {
        console.log(req.body);
    const user_with_permission = db.prepare(`
        SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission,
        user_permission.deletable AS deletable,
        user_permission.writable AS writable,
        user_permission.readable AS readable,
        user_permission.likable AS likable
        FROM users
        LEFT JOIN user_permission ON users.user_permission_id = user_permission.id
        WHERE users.username = ? AND users.userpassword = ?
    `).get(req.body.name, req.body.password);
    user_with_permission ? null : error_response(res, 'ユーザーが存在しません');

    user_with_permission.deletable === 1 ? null : error_response(res, '削除権限がありません');
    db.prepare('DELETE FROM dups').run() ? null : error_response(res, 'dupsを削除できませんでした');
    db.prepare('DELETE FROM dups_parent_tags').run() ? null : error_response(res, 'dups_parent_tagsを削除できませんでした');
    db.prepare('DELETE FROM tags').run() ? null : error_response(res, 'tagsを削除できませんでした');
    db.prepare('DELETE FROM dups_parent').run() ? null : error_response(res, 'dups_parentを削除できませんでした');
    res.json({message: 'success'});

    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

// 'like_dups_parent'というPOSTのリクエストを受け取るエンドポイントで、dups_parentのlikeを増やす。
// error_responseを使ってエラーを返すパターンとしては、
// 1. ユーザーが存在しません
// 2. いいね権限がありません
// 3. いいねを追加できませんでした
// 原因不明のエラーの場合は適当なエラーレスポンスを返す
app.post('/like_dups_parent', (req, res) => {
    try {
    const user_with_permission = db.prepare(`
        SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission,
        user_permission.deletable AS deletable,
        user_permission.writable AS writable,
        user_permission.readable AS readable,
        user_permission.likable AS likable
        FROM users
        LEFT JOIN user_permission ON users.user_permission_id = user_permission.id
        WHERE users.username = ? AND users.userpassword = ?
    `).get(req.body.name, req.body.password);
        // console.log(user_with_permission);
    user_with_permission.likable === 1 ? null : error_response(res, 'いいね権限がありません');
    console.log(req.body.dups_parent_id, user_with_permission.user_id, now(), now());
    db.prepare('INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(req.body.dups_parent_id, user_with_permission.user_id, now(), now())
            ? null : error_response(res, 'いいねを追加できませんでした');
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});


// CREATE TABLE dups_parent_tags (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   dups_parent_id INTEGER NOT NULL,
//   tag_id INTEGER NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL,
//   FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id),
//   FOREIGN KEY (tag_id) REFERENCES tags(id)
// );
// CREATE TABLE tags (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   tag TEXT NOT NULL
// );
app.post('/add_tag', (req, res) => {
    try {
        console.log(req.body.tag);
    true_if_within_10_characters_and_not_empty(req.body.tag) ? null : error_response(res, 'タグは10文字以内で入力してください');
    const user_with_permission = db.prepare(`
        SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission,
        user_permission.deletable AS deletable,
        user_permission.writable AS writable,
        user_permission.readable AS readable,
        user_permission.likable AS likable
        FROM users
        LEFT JOIN user_permission ON users.user_permission_id = user_permission.id
        WHERE users.username = ? AND users.userpassword = ?
    `).get(req.body.name, req.body.password);
    user_with_permission.writable === 1 ? null : error_response(res, '書き込み権限がありません');
    let tag = db.prepare('SELECT id FROM tags WHERE tag = ?').get(req.body.tag);
    // .id;
    // console.log(tag);
    if(tag === undefined) {
        console.log('tagがundefined');
        db.prepare('INSERT INTO tags (tag) VALUES (?)').run(req.body.tag);
        const tag_id = db.prepare('SELECT id FROM tags WHERE tag = ?').get(req.body.tag).id;
        db.prepare('INSERT INTO dups_parent_tags (dups_parent_id, tag_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
            .run(req.body.dups_parent_id, tag_id, now(), now());
            res.json({message: 'success'});
    }else{
        console.log('tagがundefinedじゃない');
        console.log(tag);
            const tag_id = db.prepare('SELECT id FROM tags WHERE tag = ?').get(req.body.tag).id
            db.prepare('INSERT INTO dups_parent_tags (dups_parent_id, tag_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
                .run(req.body.dups_parent_id, tag_id, now(), now());
                res.json({message: 'success'});
    };
    // db.prepare('INSERT INTO dups_parent_tags (dups_parent_id, tag_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
    //     .run(req.body.dups_parent_id, tag_id, now(), now())
    //         ? null : error_response(res, 'タグを追加できませんでした');
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

app.post('/read_all_tags', (req, res) => {
    try {
    const user_with_permission = db.prepare(`
        SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission,
        user_permission.deletable AS deletable,
        user_permission.writable AS writable,
        user_permission.readable AS readable,
        user_permission.likable AS likable
        FROM users
        LEFT JOIN user_permission ON users.user_permission_id = user_permission.id
        WHERE users.username = ? AND users.userpassword = ?
    `).get(req.body.name, req.body.password);
    user_with_permission.readable === 1 ? null : error_response(res, '読み込み権限がありません');
    const tags = db.prepare('SELECT * FROM tags').all();
    res.json({tags: tags});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});


app.post('/delete_tag', (req, res) => {
    try {
    const user_with_permission = db.prepare(`
        SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission,
        user_permission.deletable AS deletable,
        user_permission.writable AS writable,
        user_permission.readable AS readable,
        user_permission.likable AS likable
        FROM users
        LEFT JOIN user_permission ON users.user_permission_id = user_permission.id
        WHERE users.username = ? AND users.userpassword = ?
    `).get(req.body.name, req.body.password);
    user_with_permission.deletable === 1 ? null : error_response(res, '削除権限がありません');
    db.prepare('DELETE FROM dups_parent_tags WHERE tag_id = ?').run(req.body.tag_id);
    // 中間テーブルから該当のタグが全て削除された場合、タグテーブルからも削除する
    db.prepare('DELETE FROM tags WHERE id = ? AND id NOT IN (SELECT tag_id FROM dups_parent_tags)').run(req.body.tag_id);
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});
1