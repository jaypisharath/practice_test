// Basic test to verify Jest is working
describe('Basic Jest Test', () => {
  test('should assert that 1 equals 1', () => {
    expect(1).toBe(1);
  });
  
  test('should verify basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
  });
});
