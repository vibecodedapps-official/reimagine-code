#!/bin/sh
# revert-tests.sh: test skills/cca/scripts/revert-tests.sh on repos built inline and on the
# patterns and ground-truth fixtures.
#
# Usage: sh tests/revert-tests.sh
#
# Each inline repo is built with plumbing (hash-object, update-index, write-tree,
# commit-tree), with a pinned identity and date, so a symlink, a submodule, and a path with
# a newline need no support from the file system. Git runs with no global or system
# config. The script under test is started with `sh`, or with $RT_SH when set, for example
# `RT_SH=dash sh tests/revert-tests.sh`, and re-executes itself under bash; the test files
# it runs use `sh` either way. Every
# verdict is compared as a literal line of the result file. A test file that starts a
# process writes its pid under $RT_PIDS, and that process must be gone when the script
# returns. The work dir must be gone too, and no `.tmp` result file may be left.
#
# Cases:
#  1 statuses: A, M, D, a rename with each side in and out of test_paths, T (a file to a
#    symlink), a helper under tests/ outside test_run, a path with a space and a quote, a
#    test-code path with a newline, and a submodule and an LFS pointer in both trees; 1b
#    the same where `head` is not GNU coreutils, so each blob is written on its own
#  2 no changed tests to run            3 a missing tool: exit 127 counts as a run
#  4 setup fails in the head copy (4a), and in the reverted copy only (4b)
#  5 processes: a background process left by a passing file and a child that ignores TERM
#    after its parent dies at the deadline (5a); a command that ignores TERM until KILL
#    (5b); 5a with no controlling terminal, under dash where installed (5c, needs setsid)
#  6 the time cap                        7 the file cap, with 21 files
#  8 a path conflict                     9 the environment: LC_ALL, GIT_*, TMPDIR, and
#    GIT_CEILING_DIRECTORIES
# 10 an interrupt mid-run: exit 2, no process, no work dir, no result file
# 11 argument and keys errors: exit 2 with one line; an existing work dir is left alone
# 12 the patterns fixture               13 the ground-truth fixture
# 14 an empty merge-base tree
#
# Prints one line per mismatch, then `revert-tests test: ok` when there were none. Exit 0
# when every case matches, otherwise 1.

set -u

here=$(cd "$(dirname "$0")" && pwd)
rt=$here/../skills/cca/scripts/revert-tests.sh
sh_bin=${RT_SH:-sh}

GIT_CONFIG_GLOBAL=/dev/null
GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL GIT_CONFIG_NOSYSTEM
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

# Every temporary path lives under one root, removed as one quoted path. On Windows (Git
# Bash) it is in C:/ form, as the orchestrator's paths are.
root=$(mktemp -d)
if command -v cygpath > /dev/null 2>&1; then
	root=$(cygpath -m "$root")
fi
trap 'rm -rf "$root"' EXIT
tmp=$root/t
mkdir "$tmp" "$root/pids"
RT_PIDS=$root/pids
export RT_PIDS
bad=0
case_id=

mismatch() {
	echo "revert-tests test: $*"
	bad=$((bad + 1))
}

# g <repo> <git args>: git with a pinned identity and date.
g() {
	g_r=$1
	shift
	GIT_AUTHOR_DATE='2026-10-04 10:00:00 +0000'
	GIT_COMMITTER_DATE=$GIT_AUTHOR_DATE
	export GIT_AUTHOR_DATE GIT_COMMITTER_DATE
	git -c user.name=fixture -c user.email=fixture@example.invalid -c commit.gpgsign=false \
		-c core.autocrlf=false -c core.protectNTFS=false -c init.defaultBranch=main -C "$g_r" "$@"
}

# mkrepo <name>: a new empty repo; sets R.
mkrepo() {
	R=$root/$1
	g "$root" init -q "$1" || mismatch "$case_id: git init failed"
}

# put <mode> <path> <content>: stage a blob with the content (a printf %b string).
put() {
	p_b=$(printf '%b' "$3" | g "$R" hash-object -w --stdin) &&
		g "$R" update-index --add --cacheinfo "$1,$p_b,$2" ||
		mismatch "$case_id: cannot stage $2"
}

# gitlink <path> <sha>: stage a submodule entry.
gitlink() {
	g "$R" update-index --add --cacheinfo "160000,$2,$1" || mismatch "$case_id: cannot stage $1"
}

# drop <path>: unstage a path.
drop() {
	g "$R" update-index --force-remove -- "$1" || mismatch "$case_id: cannot drop $1"
}

# commit <branch> [<parent>]: commit the index to the branch.
commit() {
	c_t=$(g "$R" write-tree) || mismatch "$case_id: write-tree failed"
	if [ $# -ge 2 ]; then
		c_c=$(g "$R" commit-tree "$c_t" -p "$2" -m "$1") || mismatch "$case_id: commit-tree failed"
	else
		c_c=$(g "$R" commit-tree "$c_t" -m "$1") || mismatch "$case_id: commit-tree failed"
	fi
	g "$R" update-ref "refs/heads/$1" "$c_c" || mismatch "$case_id: update-ref failed"
}

# checkleft: the work dir, a `.tmp` result file, and every process a test file recorded
# must be gone.
checkleft() {
	if [ -e "$wd" ]; then
		mismatch "$case_id: the work dir is left"
		rm -rf "$wd"
	fi
	if [ -e "$tmp/res.tmp" ]; then
		mismatch "$case_id: a .tmp result file is left"
		rm -f "$tmp/res.tmp"
	fi
	for c_pf in "$RT_PIDS"/*; do
		[ -f "$c_pf" ] || continue
		c_p=$(cat "$c_pf")
		if kill -0 "$c_p" 2> /dev/null; then
			mismatch "$case_id: process ${c_pf##*/} is still live"
			kill -KILL "$c_p" 2> /dev/null
		fi
		rm -f "$c_pf"
	done
}

# run <repo> <keys> [<cap>]: the script on main...feature with these keys (a printf %b
# string) and a new work dir ($wd, $root/rw unless set); sets rc, and writes $tmp/res,
# $tmp/out, and $tmp/err.
run() {
	printf '%b' "$2" > "$tmp/keys"
	rm -f "$tmp/res"
	wd=${RW:-$root/rw}
	REVERT_TESTS_CAP=${3:-1800} "$sh_bin" "$rt" run "$1" main feature "$tmp/keys" "$wd" \
		"$tmp/res" > "$tmp/out" 2> "$tmp/err"
	rc=$?
	checkleft
}

# ok: the last run exited 0 with nothing on stdout or stderr.
ok() {
	[ "$rc" = 0 ] || mismatch "$case_id: exit $rc, expected 0; stderr [$(tr '\n' '|' < "$tmp/err")]"
	[ ! -s "$tmp/out" ] || mismatch "$case_id: stdout is not empty"
	[ ! -s "$tmp/err" ] || mismatch "$case_id: stderr is not empty: [$(tr '\n' '|' < "$tmp/err")]"
}

# verdicts <lines>: the result file's verdict lines equal these (a printf %b string).
verdicts() {
	sed -n '/^## Verdicts$/,/^## Paths$/p' "$tmp/res" | grep '^- `' > "$tmp/got"
	printf '%b' "$1" > "$tmp/exp"
	cmp -s "$tmp/exp" "$tmp/got" ||
		mismatch "$case_id: verdicts differ: got [$(tr '\n' '|' < "$tmp/got")], expected [$(tr '\n' '|' < "$tmp/exp")]"
}

# has <line>: the result file holds the line.
has() {
	grep -qxF -- "$1" "$tmp/res" || mismatch "$case_id: no line [$1]"
}

# hasnt <line>: the result file does not hold the line.
hasnt() {
	if grep -qxF -- "$1" "$tmp/res"; then
		mismatch "$case_id: an unexpected line [$1]"
	fi
}

# inblock <heading> <line>: the run block under `### <heading>` holds the line.
inblock() {
	awk -v h="### $1" '$0 == h { on = 1; next } on && /^##/ { exit } on { print }' "$tmp/res" > "$tmp/block"
	grep -qxF -- "$2" "$tmp/block" || mismatch "$case_id: no line [$2] under [$1]"
}

# fails <stderr line>: the last run exited 2 with this one line on stderr and wrote no
# result file.
fails() {
	printf '%s\n' "$1" > "$tmp/exp"
	[ "$rc" = 2 ] || mismatch "$case_id: exit $rc, expected 2"
	cmp -s "$tmp/exp" "$tmp/err" ||
		mismatch "$case_id: stderr differs: got [$(tr '\n' '|' < "$tmp/err")], expected [$1]"
	[ ! -e "$tmp/res" ] || mismatch "$case_id: a result file was written"
}

run_keys='command\tsh\nrun\ttests/test_*.sh\n'

# 1. Statuses, a helper, odd paths, a symlink, a submodule, and an LFS pointer.
case_id="case 1"
mkrepo c1
lfs='version https://git-lfs.github.com/spec/v1\noid sha256:0000000000000000000000000000000000000000000000000000000000000000\nsize 12\n'
put 100644 src/lib.sh 'greet() { echo hello; }\n'
put 100644 src/check.sh 'exit 0\n'
put 100644 tests/test_m.sh '. src/lib.sh\n[ "$(greet)" = hello ]\n'
put 100644 tests/test_d.sh 'exit 0\n'
put 100644 tests/test_gone.sh 'exit 0\n'
put 100644 tests/helper.sh 'x=1\n'
put 100644 tests/test_t.sh 'exit 0\n'
put 100644 data/big.bin "$lfs"
gitlink vendor/lib 0123456789abcdef0123456789abcdef01234567
commit main
put 100644 src/lib.sh 'greet() { echo hello; }\nwave() { echo wave; }\n'
put 100644 tests/test_m.sh '. src/lib.sh\n[ "$(wave)" = wave ]\n'
put 100644 tests/test_a.sh 'exit 0\n'
drop tests/test_d.sh
drop src/check.sh
put 100644 tests/test_moved.sh '[ ! -f src/check.sh ]\n'
drop tests/test_gone.sh
put 100644 src/gone.sh 'exit 0\n'
put 100644 tests/helper.sh 'x=2\n'
drop tests/test_t.sh
put 120000 tests/test_t.sh 'test_a.sh'
put 100644 "tests/test_a b'c.sh" 'exit 0\n'
put 100644 "$(printf 'tests/new\nline.sh')" 'exit 0\n'
commit feature main
run "$R" "$run_keys"
ok
verdicts "- \`tests/test_a b'c.sh\`: passes at head and without the change
- \`tests/test_a.sh\`: passes at head and without the change
- \`tests/test_m.sh\`: passes at head only
- \`tests/test_moved.sh\`: passes at head only
- \`tests/test_t.sh\`: does not pass at head (exit status 127)
"
has 'passes at head and without the change: 2; passes at head only: 2; does not pass at head: 1; not run: 0.'
has '- changed test-code paths not run, kept at their head state in the reverted copy: 1'
has '  - `tests/helper.sh`'
has '- test-code paths deleted at the head: 2'
has '  - `tests/test_d.sh`'
has '  - `tests/test_gone.sh`'
has '- changed paths outside test_paths: 3'
has '  - `src/check.sh`'
has '  - `src/gone.sh`'
has '  - `src/lib.sh`'
has '- test-code paths with a newline, not used: 1'
has '  - `tests/new\nline.sh`'
has '- test_paths (the default): `**/test/**`, `**/tests/**`, `**/__tests__/**`, `**/*_test.*`, `**/test_*.*`, `**/*.test.*`, `**/*.spec.*`, `**/*Tests/**`, `**/*Test.*`, `**/*Tests.*`'
awk '/^### The head copy$/ { on = 1 } /^### The reverted copy$/ { on = 2 } /^## (Setup|Runs)$/ { on = 0 } on { print on ":" $0 }' "$tmp/res" > "$tmp/copies"
for line in '1:  - `tests/test_t.sh -> test_a.sh`' '1:  - `vendor/lib at 0123456789abcdef0123456789abcdef01234567`' \
	'1:  - `data/big.bin`' '1:  - `tests/new\nline.sh`' \
	'2:  - `tests/test_t.sh -> test_a.sh`' '2:  - `vendor/lib at 0123456789abcdef0123456789abcdef01234567`' \
	'2:  - `data/big.bin`' '2:- paths of the merge-base tree not written (a newline or tab, or an empty, ., .., or .git part): none'; do
	grep -qxF -- "$line" "$tmp/copies" || mismatch "$case_id: no copy line [$line]"
done
inblock '`tests/test_moved.sh`, reverted copy' '- Exit status: 1'
cp "$tmp/got" "$tmp/verdicts.1"
cp "$tmp/copies" "$tmp/copies.1"

# 1b. The same repo where `head` is not GNU coreutils, as on macOS: the script writes each
# blob with its own `cat-file blob`, and the verdicts and copies are the same.
case_id="case 1b"
mkdir "$root/shim"
printf '#!/bin/sh\nif [ "${1:-}" = --version ]; then : > "%s/asked"; exit 1; fi\nexec "%s" "$@"\n' \
	"$root/shim" "$(command -v head)" > "$root/shim/head"
chmod +x "$root/shim/head"
old_path=$PATH
# PATH splits on `:`, so on Windows the entry takes the /c/ form.
shim=$root/shim
if command -v cygpath > /dev/null 2>&1; then
	shim=$(cygpath -u "$shim")
fi
PATH=$shim:$PATH
run "$R" "$run_keys"
PATH=$old_path
ok
[ -f "$root/shim/asked" ] || mismatch "$case_id: the script did not ask head for its version"
sed -n '/^## Verdicts$/,/^## Paths$/p' "$tmp/res" | grep '^- `' > "$tmp/got"
cmp -s "$tmp/verdicts.1" "$tmp/got" || mismatch "$case_id: the verdicts differ from case 1"
awk '/^### The head copy$/ { on = 1 } /^### The reverted copy$/ { on = 2 } /^## (Setup|Runs)$/ { on = 0 } on { print on ":" $0 }' "$tmp/res" > "$tmp/copies"
cmp -s "$tmp/copies.1" "$tmp/copies" || mismatch "$case_id: the copies differ from case 1"

# 2. No changed tests to run: nothing is exported or run.
case_id="case 2"
mkrepo c2
put 100644 src/a.sh 'exit 0\n'
commit main
put 100644 src/a.sh 'exit 1\n'
commit feature main
run "$R" "$run_keys"
ok
has 'No changed tests to run.'
has '- files to run: none'
hasnt '## Copies'
hasnt '## Runs'

# 3. A missing tool: exit 127 is a run that does not pass at the head.
case_id="case 3"
mkrepo c3
put 100644 README 'x\n'
commit main
put 100644 tests/test_x.sh 'exit 0\n'
commit feature main
run "$R" 'command\trt-no-such-tool\nrun\ttests/test_*.sh\n'
ok
verdicts '- `tests/test_x.sh`: does not pass at head (exit status 127)\n'
inblock '`tests/test_x.sh`, head copy' '- Exit status: 127'

# 4a. Setup fails in the head copy: nothing else runs.
case_id="case 4a"
run "$R" 'command\tsh\nrun\ttests/test_*.sh\nsetup\texit 3\n'
ok
verdicts '- `tests/test_x.sh`: not run: setup failed in the head copy\n'
inblock 'Setup, head copy' '- Exit status: 3'
hasnt '## Runs'

# 4b. Setup passes in the head copy and fails in the reverted copy, which lacks the file
# it needs.
case_id="case 4b"
mkrepo c4
put 100644 README 'x\n'
commit main
put 100644 src/new.sh 'exit 0\n'
put 100644 tests/test_x.sh 'exit 0\n'
commit feature main
run "$R" 'command\tsh\nrun\ttests/test_*.sh\nsetup\t[ -f src/new.sh ]\n'
ok
verdicts '- `tests/test_x.sh`: not run: setup failed in the reverted copy\n'
inblock 'Setup, head copy' '- Exit status: 0'
inblock 'Setup, reverted copy' '- Exit status: 1'

# status <file>: the exit status line of the file's head copy run.
status() {
	awk -v h="### \`$1\`, head copy" '$0 == h { on = 1; next } on && /^- Exit status: / { print; exit }' \
		"$tmp/res"
}

# 5a. Processes. Each file's processes are killed when it ends; checkleft fails on any that
# lives on. The child ignores TERM; the group's TERM ends the rest, and the KILL that
# follows ends the child.
case_id="case 5a"
mkrepo c5
put 100644 README 'x\n'
commit main
put 100644 tests/test_bg.sh 'sleep 60 &\necho $! > "$RT_PIDS/bg"\n'
put 100644 tests/test_child.sh 'sh -c '"'"'trap "" TERM; echo $$ > "$RT_PIDS/child"; sleep 60'"'"' &\nsleep 60\n'
commit feature main
run "$R" 'command\tsh\nrun\ttests/test_*.sh\ntimeout\t2\n'
ok
verdicts '- `tests/test_bg.sh`: passes at head and without the change
- `tests/test_child.sh`: does not pass at head (timed out)
'
status tests/test_child.sh > "$tmp/st"
grep -qx -- '- Exit status: timed out after [0-9]* seconds (exit status 143)' "$tmp/st" ||
	mismatch "$case_id: status [$(cat "$tmp/st")]"

# 5b. A command that ignores TERM itself, so its group ends only on the KILL 10 seconds
# after the deadline.
case_id="case 5b"
mkrepo c5b
put 100644 README 'x\n'
commit main
put 100644 tests/test_stubborn.sh 'echo $$ > "$RT_PIDS/stubborn"\nsleep 60\n'
commit feature main
run "$R" 'command\ttrap "" TERM; sh\nrun\ttests/test_*.sh\ntimeout\t2\n'
ok
verdicts '- `tests/test_stubborn.sh`: does not pass at head (timed out)\n'
status tests/test_stubborn.sh > "$tmp/st"
grep -qx -- '- Exit status: timed out after 1[2-9] seconds (exit status 137)' "$tmp/st" ||
	mismatch "$case_id: status [$(cat "$tmp/st")]"

# 5c. 5a's repo again in a new session with no controlling terminal, as under CI, started
# with dash when it is installed: dash turns job control off without a terminal, so the
# script must re-execute itself under bash. Needs setsid (Linux); skipped where it is
# missing.
if command -v setsid > /dev/null 2>&1; then
	case_id="case 5c"
	nc_sh=$sh_bin
	if command -v dash > /dev/null 2>&1; then
		nc_sh=dash
	fi
	printf '%b' 'command\tsh\nrun\ttests/test_*.sh\ntimeout\t2\n' > "$tmp/keys"
	rm -f "$tmp/res"
	wd=$root/rw
	setsid -w "$nc_sh" "$rt" run "$root/c5" main feature "$tmp/keys" "$wd" "$tmp/res" \
		< /dev/null > "$tmp/out" 2> "$tmp/err"
	rc=$?
	checkleft
	ok
	verdicts '- `tests/test_bg.sh`: passes at head and without the change
- `tests/test_child.sh`: does not pass at head (timed out)
'
fi

# 6. The time cap: the first file uses the bundle's 3 seconds, and the second is not run.
case_id="case 6"
mkrepo c6
put 100644 README 'x\n'
commit main
put 100644 tests/test_1.sh 'sleep 5\n'
put 100644 tests/test_2.sh 'exit 0\n'
commit feature main
run "$R" 'command\tsh\nrun\ttests/test_*.sh\ntimeout\t10\n' 3
ok
verdicts '- `tests/test_1.sh`: does not pass at head (timed out)
- `tests/test_2.sh`: not run: time cap
'
has '- test_timeout: 10 seconds per command; the bundle'"'"'s cap is 3 seconds from its first command'

# 7. The file cap: the 21st file in path order is not run.
case_id="case 7"
mkrepo c7
put 100644 README 'x\n'
commit main
exp7=
n=1
while [ "$n" -le 21 ]; do
	f=$(printf 'tests/test_%02d.sh' "$n")
	put 100644 "$f" 'exit 0\n'
	if [ "$n" -le 20 ]; then
		exp7="$exp7- \`$f\`: passes at head and without the change\n"
	else
		exp7="$exp7- \`$f\`: not run: file cap\n"
	fi
	n=$((n + 1))
done
commit feature main
run "$R" "$run_keys"
ok
verdicts "$exp7"
has 'passes at head and without the change: 20; passes at head only: 0; does not pass at head: 0; not run: 1.'

# 8. A path conflict: `tests` is a file at the merge-base, kept there in the reverted copy,
# where the head's test code needs a directory.
case_id="case 8"
mkrepo c8
put 100644 tests 'x\n'
commit main
drop tests
put 100644 tests/test_a.sh 'exit 0\n'
commit feature main
run "$R" "$run_keys"
ok
verdicts '- `tests/test_a.sh`: not run: path conflict, `tests` and `tests/test_a.sh`\n'
hasnt '## Runs'

# 9. The environment: the caller's LC_ALL, no GIT_* variable, TMPDIR in the work dir, and
# no repository found from a copy, though the work dir lies inside one.
case_id="case 9"
mkrepo c9
put 100644 README 'x\n'
commit main
put 100644 tests/test_env.sh 'echo "lc=${LC_ALL-unset}"
echo "probe=${GIT_RT_PROBE-unset}"
case $TMPDIR in "$RT_WORK"/*) echo "tmpdir in the work dir" ;; *) echo "tmpdir elsewhere: $TMPDIR" ;; esac
if git rev-parse --git-dir > /dev/null 2>&1; then echo "inside a repo"; else echo "no repo"; fi
'
commit feature main
RW=$R/inner/rw
RT_WORK=$RW
export RT_WORK
LC_ALL=POSIX
GIT_RT_PROBE=1
export LC_ALL GIT_RT_PROBE
run "$R" "$run_keys"
unset RW RT_WORK LC_ALL GIT_RT_PROBE
ok
verdicts '- `tests/test_env.sh`: passes at head and without the change\n'
for line in '    lc=POSIX' '    probe=unset' '    tmpdir in the work dir' '    no repo'; do
	inblock '`tests/test_env.sh`, head copy' "$line"
done

# 10. An interrupt mid-run: the script exits 2 and leaves no process, work dir, or result.
case_id="case 10"
mkrepo c10
put 100644 README 'x\n'
commit main
put 100644 tests/test_wait.sh 'echo $$ > "$RT_PIDS/wait"\nsleep 60\n'
commit feature main
printf '%b' "$run_keys" > "$tmp/keys"
rm -f "$tmp/res"
wd=$root/rw
"$sh_bin" "$rt" run "$R" main feature "$tmp/keys" "$wd" "$tmp/res" > "$tmp/out" 2> "$tmp/err" &
sp=$!
n=0
while [ ! -s "$RT_PIDS/wait" ] && [ "$n" -lt 100 ]; do
	sleep 0.2
	n=$((n + 1))
done
[ -s "$RT_PIDS/wait" ] || mismatch "$case_id: the test file did not start"
kill -TERM "$sp"
wait "$sp"
rc=$?
[ "$rc" = 2 ] || mismatch "$case_id: exit $rc, expected 2"
[ ! -e "$tmp/res" ] || mismatch "$case_id: a result file was written"
checkleft

# 11. Argument and keys errors.
case_id="case 11a"
mkdir "$root/rw"
: > "$root/rw/keep"
printf '%b' "$run_keys" > "$tmp/keys"
"$sh_bin" "$rt" run "$R" main feature "$tmp/keys" "$root/rw" "$tmp/res" > "$tmp/out" 2> "$tmp/err"
rc=$?
fails "revert-tests: work dir exists: $root/rw"
[ -f "$root/rw/keep" ] || mismatch "$case_id: the existing work dir was changed"
rm -rf "$root/rw"
case_id="case 11b"
run "$R" 'run\ttests/test_*.sh\n'
fails 'revert-tests: keys: no command'
case_id="case 11c"
run "$R" 'command sh\n'
fails 'revert-tests: keys: a line without a tab'
case_id="case 11d"
run "$R" 'command\tsh\nrun\tx\nbogus\t1\n'
fails 'revert-tests: keys: unknown key bogus'
case_id="case 11e"
run "$R" 'command\tsh\nrun\tx\ntimeout\t0\n'
fails 'revert-tests: keys: timeout must be whole seconds, 1 or more'
case_id="case 11f"
"$sh_bin" "$rt" > "$tmp/out" 2> "$tmp/err"
rc=$?
fails 'usage: revert-tests.sh run <repo> <base> <head> <keys file> <work dir> <result file>'

# 14. An empty merge-base tree: the reverted copy holds the head's test file and none of
# its production files, so a test that needs nothing passes in both copies.
case_id="case 14"
mkrepo c14
commit main
put 100644 src/a.sh 'exit 0\n'
put 100644 tests/test_a.sh 'exit 0\n'
commit feature main
run "$R" "$run_keys"
ok
verdicts '- `tests/test_a.sh`: passes at head and without the change\n'

# 12. The patterns fixture: both files pass at the head only, and the reverted run of
# tests/test_users.sh shows P18's test passing before the migration test fails.
case_id="case 12"
if m=$(TMPDIR=$root sh "$here/fixture/build.sh" patterns); then
	run "$(dirname "$m")/app" "$run_keys"
	ok
	verdicts '- `tests/test_log.sh`: passes at head only
- `tests/test_users.sh`: passes at head only
'
	inblock '`tests/test_users.sh`, reverted copy' '    pass test_deactivate_rejects_bad_id'
	inblock '`tests/test_users.sh`, reverted copy' '    pass test_deactivate_keeps_row'
else
	mismatch "$case_id: the patterns fixture did not build"
fi

# 13. The ground-truth fixture, bundle PR-1.
case_id="case 13"
if m=$(TMPDIR=$root sh "$here/fixture/build.sh" ground-truth); then
	run "$(dirname "$m")/svc" 'command\tsh\nrun\ttests/test_*.sh\nrun\ttests/scenario_*.sh\n'
	ok
	verdicts '- `tests/scenario_bulk.sh`: passes at head only
- `tests/scenario_dates.sh`: passes at head and without the change
- `tests/scenario_fetch_record.sh`: does not pass at head (exit status 1)
- `tests/scenario_hrn_lookup.sh`: passes at head and without the change
- `tests/scenario_report_audit.sh`: passes at head only
- `tests/scenario_report_read.sh`: passes at head only
- `tests/test_bulk_import.sh`: passes at head only
- `tests/test_schemas.sh`: passes at head only
- `tests/test_sql_contract.sh`: passes at head only
- `tests/test_upsert_site.sh`: passes at head only
- `tests/test_waiver.sh`: passes at head only
'
	inblock '`tests/scenario_fetch_record.sh`, head copy' '    expected 1 row, got 0'
	inblock '`tests/test_sql_contract.sh`, reverted copy' '    pass test_stamp_has_no_null_placeholder'
	inblock '`tests/test_sql_contract.sh`, reverted copy' '    pass test_stamp_notifies_nobody'
	inblock '`tests/test_bulk_import.sh`, reverted copy' '    pass test_imports_the_batch'
else
	mismatch "$case_id: the ground-truth fixture did not build"
fi

if [ "$bad" -gt 0 ]; then
	exit 1
fi
echo "revert-tests test: ok"
