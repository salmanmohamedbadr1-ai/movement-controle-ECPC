import { getHallGroup, isSameHallGroup } from './hall-group.util';

describe('hall-group.util', () => {
  describe('getHallGroup', () => {
    it('groups hall 1 and 2 together', () => {
      expect(getHallGroup(1)).toEqual([1, 2]);
      expect(getHallGroup(2)).toEqual([1, 2]);
    });

    it('keeps hall 3 in its own group', () => {
      expect(getHallGroup(3)).toEqual([3]);
    });

    it('keeps hall 4 in its own group', () => {
      expect(getHallGroup(4)).toEqual([4]);
    });
  });

  describe('isSameHallGroup', () => {
    it('treats hall 1 and hall 2 as the same group', () => {
      expect(isSameHallGroup(1, 2)).toBe(true);
      expect(isSameHallGroup(2, 1)).toBe(true);
    });

    it('does not treat hall 3 and hall 4 as the same group', () => {
      expect(isSameHallGroup(3, 4)).toBe(false);
    });

    it('does not treat hall 1/2 as the same group as hall 3 or hall 4', () => {
      expect(isSameHallGroup(1, 3)).toBe(false);
      expect(isSameHallGroup(2, 4)).toBe(false);
    });
  });
});
