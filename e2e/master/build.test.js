const {test, message, cmd, compare, check} = require('../run-test')(__filename);
test(message, async t => (await cmd(), check(t, await compare())));
