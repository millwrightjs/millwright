const {test, message, cmd, compare, check} = require('../setup')(__filename);
test(message, async t => (await cmd(), check(t, await compare())));
