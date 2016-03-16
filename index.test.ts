import { range } from "./index";
import { assert } from "chai";
const { deepEqual: same } = assert;

describe("range", () => {
  describe("number", () => {
    it("0", () => {
      const { done } = range(0).next();
      assert.equal(done, true);
    });

    it("[0,2), with index", () => {
      const gen = range(2);

      let n1 = gen.next();
      assert.deepEqual(n1, {
        done: false,
        value: 0,
        index: 0,
      });

      let n2 = gen.next();
      assert.deepEqual(n2, {
        done: false,
        value: 1,
        index: 1,
      });

      let n3 = gen.next();
      assert.deepEqual(n3, {
        done: true,
      });
    });

    it("[3,6)", () => {
      same(
        range(3, 6).array(),
        [3, 4, 5]
      );
    });

    it("[0,10), by 3", () => {
      same(
        range(0, 10, 3).array(),
        [0, 3, 6, 9]
      );
    });

    it("[0,-10)", () => {
      same(
        range(0, -10).array(),
        []
      );
    });

    describe("decrementing sequence", () => {
      it("[0,10) by -3", () => {
        same(
          range(0, 10, -3).array(),
          []
        );
      });

      it("[0,-10) by -3", () => {
        same(
          range(0, -10, -3).array(),
          [0, -3, -6, -9]
        );
      });
    });
  });

  describe("value collection", () => {
    it("array", () => {
      same(
        range(3).array(),
        [0, 1, 2]
      );
    });

    it("dictionary", () => {
      same(
        range(3).dict(),
        {
          '0': 0,
          '1': 1,
          '2': 2,
        }
      );
    });
  });

  describe("reindex", () => {
    it("remap keys", () => {
      same(
        range(3).reindex(v => v * 100).dict(),
        {
          '0': 0,
          '100': 1,
          '200': 2,
        }
      );
    });
  });

  describe("array", () => {
    it("[]", () => {
      same(
        range([]).dict(),
        {
        }
      );
    });

    it("[42,43,44], with index", () => {
      same(
        range([42, 43, 44]).dict(),
        {
          '0': 42,
          '1': 43,
          '2': 44,
        }
      );
    });
  });

  describe("object", () => {
    it("{}", () => {
      same(
        range({}).dict(),
        {
        }
      );
    });

    it("non empty dict, with index", () => {
      same(
        range({ a: 1, b: 2, c: 3 }).dict(),
        {
          'a': 1,
          'b': 2,
          'c': 3,
        }
      );
    });
  });

  describe("map", () => {
    it("transforms the sequence", () => {
      same(
        range(3).map((val, key) => [val * 10, key]).array(),
        [[0, 0], [10, 1], [20, 2]]
      )
    });
  });

  describe("filter", () => {
    it("remove items by value", () => {
      same(
        range(7).filter(v => v % 2 === 0).array(),
        [0, 2, 4, 6]
      );
    });

    it("remove items by index", () => {
      same(
        range(7).filter((v, k) => k >= 3).array(),
        [3, 4, 5, 6]
      );
    });
  });

  describe("limit", () => {
    it("limit the number of items in sequence", () => {
      same(
        range(100).limit(3).array(),
        [0, 1, 2]
      )
    });
  });

  describe("offset", () => {
    it("discard the initial n items in sequence", () => {
      same(
        range(5).offset(2).array(),
        [2, 3, 4]
      )
    });
  });

  describe("tap", () => {
    it("attach side-effect to sequence", () => {
      const acc = [];

      // throw away the result, we just care about side-effect
      range(3).tap((v, k) => {
        acc.push([k, v * 10]);
      }).array();

      same(
        acc,
        [[0, 0], [1, 10], [2, 20]]
      )
    });
  });
});

