/* eslint-disable no-console, no-process-exit */
'use strict';

var fs = require('fs');
var path = require('path');
var childProc = require('child_process');
var pkg = require('../package.json');
var procStream = require('procstreams');

var dryRun = process.argv.indexOf('--dry-run') !== -1;
var verbose = process.argv.indexOf('--verbose') !== -1;
var nodejitsu = process.argv.indexOf('--nodejitsu') !== -1;
var hashMatcher = /prosemirror@.*?\(git:\/\/github\.com\/prosemirror\/prosemirror\.git#(.*?)\)/;
var npmRegistry = 'https://registry.' + (nodejitsu ? 'nodejitsu.com' : 'npmjs.org');
var spawnOpts = {
    cwd: path.resolve(path.join(__dirname, '..')),
    encoding: 'utf8'
};

// Ensure there's a git dir so we can commit new releases
fs.statSync(path.join(__dirname, '..', '.git'));
log('`.git` exists, we can commit new releases');

// Run NPM update, ensure success
log('Running `npm update`');
var update = exec('npm', ['update', '--registry', npmRegistry]);
ok(update);

// Ensure that we got a git commit hash back from `npm update`
var hash = update.stdout.match(hashMatcher);
if (!hash || !hash[1]) {
    throw new Error('Couldn\'t find git commit hash after running npm update');
}

// Check if it's the same commit hash as the previous release
var commitHash = hash[1];
if (pkg.prosemirror.gitHash === commitHash) {
    log('Same hash as last release, stopping release process');
    process.exit(0);
}

log('Got new commit after `npm update`: ' + commitHash);

// Ensure that tests are passing. Running the browser tests would be
// a lot of work, so we'll skip that for now (contributions welcome)
var proseOpts = { cwd: path.resolve(path.join(__dirname), '..', 'node_modules', 'prosemirror') };
log('Installing prosemirror dependencies in order to run tests');
ok(exec('npm', ['install', '--registry', npmRegistry], proseOpts));

log('Running prosemirror tests');
ok(exec('npm', ['test'], proseOpts));

// Build prosemirror to dist files
log('Building prosemirror source files to dist versions');
var babelPath = path.join(__dirname, '..', 'node_modules', '.bin', 'babel');
ok(exec(babelPath, ['-d', 'dist', 'node_modules/prosemirror/src']));

// Generate an md5 sum for the built files
// (might be prosemirror just made readme changes, for instance)
log('Generating MD5-sum for dist files');
procStream('find', ['dist', '-type', 'f'], spawnOpts)
    .pipe('sort', ['-u'], spawnOpts)
    .pipe('xargs', ['cat'], spawnOpts)
    .pipe('md5sum')
    .data(function(err, stdout) {
        if (err) {
            throw err;
        }

        var distHash = stdout.toString().split(/\s/, 1)[0];
        if (pkg.prosemirror.distHash === distHash) {
            log('Same dist-hash as last release, stopping release process');
            process.exit(0);
        }

        log('New dist-hash calculated (' + distHash + '), proceeding');
        updateAndRelease(distHash, commitHash);
    });

function updateAndRelease(distHash, gitHash) {
    // Update package.json
    pkg.prosemirror.gitHash = gitHash;
    pkg.prosemirror.distHash = distHash;

    if (dryRun) {
        log('New `package.json` (minus new version number):');
        log('==============================================');
        log(JSON.stringify(pkg, null, 2));
        log('==============================================');
        log('--dry-run specified, will not write/commit/push');
        process.exit(0);
    }

    // Write new package.json
    log('Writing new `package.json` containing new git+dist hashes');
    fs.writeFileSync(
        path.join(__dirname, '..', 'package.json'),
        JSON.stringify(pkg, null, 2),
        { encoding: 'utf8' }
    );

    // Add and commit to git
    log('Commiting new release to git');
    ok(exec('git', ['add', 'package.json']));
    ok(exec('git', ['add', 'dist']));
    ok(exec('git', ['commit', '-m', 'Use commit ' + gitHash]));

    // Now bump the version
    log('Bumping NPM package version number');
    ok(exec('npm', ['version', 'major']));

    // Push to remote
    log('Push to github');
    ok(exec('git', ['push', 'origin', 'master']));

    // Now release new version to npm
    log('Releasing new version on NPM');
    ok(exec('npm', ['publish']));
}

function exec(command, args, options) {
    var opts = Object.assign({}, spawnOpts, options || {});

    return childProc.spawnSync(command, args, opts);
}

function ok(cmdRes) {
    if (cmdRes.error || cmdRes.status > 0) {
        throw (cmdRes.error || new Error(cmdRes.stderr));
    }

    return true;
}

function log(msg) {
    if (verbose) {
        console.log(msg);
    }
}
