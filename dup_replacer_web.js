// DROP TABLE IF EXISTS user_permission;
// DROP TABLE IF EXISTS users;
// DROP TABLE IF EXISTS dups_parent;
// DROP TABLE IF EXISTS dups;

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
//   user_id INTEGER NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL,
//   FOREIGN KEY (user_id) REFERENCES users(id)
// );


// CREATE TABLE dups (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   dups_parent_id INTEGER NOT NULL,
//   content_group_id INTEGER NOT NULL,
//   content_1 TEXT NOT NULL,
//   content_2 TEXT NOT NULL,
//   content_3 TEXT NOT NULL,
//   FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
// );
// INSERT INTO user_permission (id, permission, readable, writable, deletable, created_at, updated_at) VALUES (1, 'guest', 1, 0, 0, DATETIME('now'), DATETIME('now'));
// INSERT INTO user_permission (id, permission, readable, writable, deletable, created_at, updated_at) VALUES (2, 'user', 1, 1, 1, DATETIME('now'), DATETIME('now'));

// INSERT INTO users (user_permission_id, name, password, created_at, updated_at) VALUES (1, 'GUEST', 'GUEST_PASS', DATETIME('now'), DATETIME('now'));
// INSERT INTO users (user_permission_id, name, password, created_at, updated_at) VALUES (2, 'name1', 'password1', DATETIME('now'), DATETIME('now'));
// INSERT INTO users (user_permission_id, name, password, created_at, updated_at) VALUES (2, 'name2', 'password2', DATETIME('now'), DATETIME('now'));


const express = require('express');
const sqlite = require('better-sqlite3');
const db = new sqlite('../dup.sqlite3');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors());
const port = 8000;
app.listen(port, "0.0.0.0", () => console.log(`App listening!!! at http://localhost:${port}`) );

const now = () => new Date().toISOString();
const true_if_within_4000_characters_and_not_empty = (str) => str.length > 2 && str.length <= 4000 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false;

// '/read_dups_parent'というGETのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsとそれを紐づけるuserを取得する。
// それらの全てのidとcontent1とcontent2とcontent3を返すとcreated_atとupdated_atとuserのnameを返す
// 原因不明のエラーの場合は適当なエラーレスポンスを返す
app.get('/read_dups_parent', (req, res) => {
    try {
        const rows = db.prepare('SELECT dups_parent.id AS dups_parent_id, dups_parent.created_at AS dups_parent_created_at, dups_parent.updated_at AS dups_parent_updated_at, users.name AS user_name, dups.content_group_id AS dups_content_group_id, dups.content_1 AS dups_content_1, dups.content_2 AS dups_content_2, dups.content_3 AS dups_content_3 FROM dups_parent LEFT JOIN users ON dups_parent.user_id = users.id LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id').all();
    res.json(rows);
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});


// expressの一般的なエラーのレスポンス。引数としてエラー文字列を含めて呼び出す
const error_response = (res, error_message) => res.status(400).json({ error: error_message });

// '/insert_dup'というPOSTのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsを作成する。
app.post('/insert_dup', (req, res) => {
    console.log(req.body.B_C_list);
    try {
    req.body.B_C_list.forEach((EACH_CONTENT) => {
        true_if_within_4000_characters_and_not_empty(EACH_CONTENT.join("")) ? null : error_response(res, '4000文字以内で入力して');
    });
    const user_with_permission = db.prepare('SELECT * FROM users LEFT JOIN user_permission ON users.user_permission_id = user_permission.id WHERE users.name = ? AND users.password = ?').get(req.body.name, req.body.password);
    user_with_permission.writable === 1 ? null : error_response(res, '書き込み権限がありません');
    db.prepare('INSERT INTO dups_parent (user_id, created_at, updated_at) VALUES (?, ?, ?)').run(user_with_permission.id, now(), now()) ? null : error_response(res, 'dups_parentに追加できませんでした');
    const dups_parent_id = db.prepare('SELECT id FROM dups_parent ORDER BY id DESC LIMIT 1').get().id;
    // console.log(dups_parent_id);
    req.body.B_C_list.forEach((EACH_CONTENT, CONTENT_GROUP_ID) => {
            // console.log("dups_parent_id", dups_parent_id);
            // console.log("CONTENT_GROUP_ID", CONTENT_GROUP_ID);
            // console.log("EACH_CONTENT[0]", EACH_CONTENT[0]);
            // console.log("EACH_CONTENT[1]", EACH_CONTENT[1]);
            // console.log("EACH_CONTENT[2]", EACH_CONTENT[2]);
            // console.log("now()", now());
        db.prepare('INSERT INTO dups (dups_parent_id, content_group_id, content_1, content_2, content_3) VALUES (?, ?, ?, ?, ?)').run(dups_parent_id, CONTENT_GROUP_ID, EACH_CONTENT[0], EACH_CONTENT[1], EACH_CONTENT[2]) ? null : error_response(res, 'dupsに追加できませんでした');
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
    const user_with_permission = db.prepare('SELECT users.id AS user_id, users.name AS user_name, user_permission.permission AS user_permission FROM users LEFT JOIN user_permission ON users.user_permission_id = user_permission.id WHERE users.name = ? AND users.password = ?').get(req.body.name, req.body.password) ? null : error_response(res, 'ユーザーが存在しません');
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
    const user_with_permission = db.prepare('SELECT users.id AS user_id, users.name AS user_name, user_permission.permission AS user_permission FROM users LEFT JOIN user_permission ON users.user_permission_id = user_permission.id WHERE users.name = ? AND users.password = ?').get(req.body.name, req.body.password) ? null : error_response(res, 'ユーザーが存在しません');
    user_with_permission.deletable === 1 ? null : error_response(res, '削除権限がありません');
    db.prepare('DELETE FROM dups').run() ? null : error_response(res, 'dupsを削除できませんでした');
    db.prepare('DELETE FROM dups_parent').run() ? null : error_response(res, 'dups_parentを削除できませんでした');
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});