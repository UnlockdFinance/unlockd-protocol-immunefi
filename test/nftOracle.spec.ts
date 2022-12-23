import { makeSuite, TestEnv } from "./helpers/make-suite";
const { expect } = require("chai");

makeSuite("NFTOracle: General functioning", (testEnv: TestEnv) => {
  before(async () => {});

  it("Set Admin correctly", async () => {
    const { mockNftOracle, users } = testEnv;
    await mockNftOracle.setPriceManagerStatus(users[0].address, true);
    expect(await mockNftOracle.isPriceManager(users[0].address)).eq(true);
  });

  it("Set and get Mocknft price at 1000", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.addCollection(collectionMock);
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);
  });

  it("Add 2 Multi Assets", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;

    await mockNftOracle.addCollection(collection1);
    await mockNftOracle.addCollection(collection2);

    await mockNftOracle.setMultipleNFTPrices(
      [collection1, collection2],
      [1, 1],
      [100, 200]
    );

    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(100);
    expect(await mockNftOracle.getNFTPrice(collection2, 1)).to.be.eq(200);
  });

  it("Add 3 Multi Assets", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;
    const collection3 = users[3].address;

    await mockNftOracle.addCollection(collection3);
    await mockNftOracle.setMultipleNFTPrices(
      [collection1, collection2, collection3],
      [1, 1, 1],
      [100, 200, 300]
    );

    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(100);
    expect(await mockNftOracle.getNFTPrice(collection2, 1)).to.be.eq(200);
    expect(await mockNftOracle.getNFTPrice(collection3, 1)).to.be.eq(300);

    const priceArray = await mockNftOracle.getMultipleNFTPrices(
      [collection1, collection2, collection3],
      [1, 1, 1]
    );
    expect(await parseInt(priceArray[0]["_hex"], 16)).to.be.eq(100);
    expect(await parseInt(priceArray[1]["_hex"], 16)).to.be.eq(200);
    expect(await parseInt(priceArray[2]["_hex"], 16)).to.be.eq(300);
  });

  it("Add 3 Multi Assets - BigNumbers", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;
    const collection3 = users[3].address;

    const bigNumPrices = [
      BigInt(100000000000000),
      BigInt(200000000000000),
      BigInt(300000000000000),
    ];

    await mockNftOracle.setMultipleNFTPrices(
      [collection1, collection2, collection3],
      [1, 1, 1],
      bigNumPrices
    );

    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(
      100000000000000
    );
    expect(await mockNftOracle.getNFTPrice(collection2, 1)).to.be.eq(
      200000000000000
    );
    expect(await mockNftOracle.getNFTPrice(collection3, 1)).to.be.eq(
      300000000000000
    );

    const priceArray = await mockNftOracle.getMultipleNFTPrices(
      [collection1, collection2, collection3],
      [1, 1, 1]
    );
    expect(await parseInt(priceArray[0]["_hex"], 16)).to.be.eq(100000000000000);
    expect(await parseInt(priceArray[1]["_hex"], 16)).to.be.eq(200000000000000);
    expect(await parseInt(priceArray[2]["_hex"], 16)).to.be.eq(300000000000000);
  });

  it("Single asset price updates", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;

    await mockNftOracle.setNFTPrice(collection1, 1, 150);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(150);

    await mockNftOracle.setNFTPrice(collection1, 1, 200);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(200);
  });

  it("Multiple asset price updates", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;

    // Set and get first prices
    await mockNftOracle.setNFTPrice(collection1, 1, 150);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(150);
    await mockNftOracle.setNFTPrice(collection1, 1, 250);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(250);

    // Set and get second prices
    await mockNftOracle.setNFTPrice(collection1, 1, 200);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(200);
    await mockNftOracle.setNFTPrice(collection1, 1, 100);
    expect(await mockNftOracle.getNFTPrice(collection1, 1)).to.be.eq(100);
  });
});

makeSuite("NFTOracle: Reverting Errors", (testEnv: TestEnv) => {
  before(async () => {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.addCollection(collectionMock);
  });

  it("Should be reverted as NFTOracle is already initialized", async () => {
    const { mockNftOracle, users, configurator } = testEnv;
    await mockNftOracle.setPriceManagerStatus(users[0].address, true);
    const admin = users[0].address;
    await expect(
      mockNftOracle.initialize(admin, configurator.address)
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Should be reverted as it is a non-existing collection", async () => {
    const { mockNftOracle, users } = testEnv;
    const collection2 = users[2].address;
    await expect(mockNftOracle.getNFTPrice(collection2, 1)).to.be.revertedWith(
      "NonExistingCollection(",
      collection2,
      ")"
    );
  });

  it("Should be reverted as price is 0", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await expect(
      mockNftOracle.getNFTPrice(collectionMock, 2)
    ).to.be.revertedWith("PriceIsZero()");
  });

  it("Should be reverted as the collection has been deleted", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);

    await mockNftOracle.removeCollection(collectionMock);
    await expect(
      mockNftOracle.getNFTPrice(collectionMock, 1)
    ).to.be.revertedWith("NonExistingCollection(", collectionMock, ")");
  });

  it("Should be reverted as contract is paused", async function () {
    const { mockNftOracle, users } = testEnv;
    const collectionMock = users[0].address;
    await mockNftOracle.addCollection(collectionMock);
    await mockNftOracle.setNFTPrice(collectionMock, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(collectionMock, 1)).to.eq(1000);

    await mockNftOracle.setPause(collectionMock, true);
    await expect(
      mockNftOracle.setNFTPrice(collectionMock, 1, 1000)
    ).to.be.revertedWith("NFTPaused()");
    await mockNftOracle.setPause(collectionMock, false);
  });

  it("Should be reverted as array lengths aren't matching (2 vs 3)", async function () {
    const { mockNftOracle, users } = testEnv;
    const collection1 = users[1].address;
    const collection2 = users[2].address;
    const collection3 = users[3].address;

    await mockNftOracle.addCollection(collection1);
    await mockNftOracle.addCollection(collection2);
    await mockNftOracle.addCollection(collection3);

    await expect(
      mockNftOracle.setMultipleNFTPrices(
        [collection1, collection2, collection3],
        [1, 1],
        [100, 200, 300]
      )
    ).to.be.revertedWith("ArraysLengthInconsistent()");
  });

  it("Testing overflows", async () => {
    const { mockNftOracle, users } = testEnv;

    // More money than there exists in the world:
    await mockNftOracle.setNFTPrice(
      users[0].address,
      1,
      BigInt("100000000000000000000000000000000000")
    );
    expect(await mockNftOracle.getNFTPrice(users[0].address, 1)).to.be.eq(
      BigInt("100000000000000000000000000000000000")
    );
  });
});

/// TEST PAUSE: ///

makeSuite("NFTOracle: Test Pause", (testEnv: TestEnv) => {
  before(async () => {});

  it("Should revert as collection is paused", async () => {
    const { mockNftOracle, users } = testEnv;
    await mockNftOracle.addCollection(users[0].address);
    await mockNftOracle.addCollection(users[1].address);
    await mockNftOracle.addCollection(users[2].address);
    await mockNftOracle.setNFTPrice(users[0].address, 1, 400);

    await mockNftOracle.setPause(users[0].address, true);
    await expect(
      mockNftOracle.setNFTPrice(users[0].address, 1, 410)
    ).to.be.revertedWith("NFTPaused()");

    await mockNftOracle.setNFTPrice(users[2].address, 1, 400);
    await mockNftOracle.setPause(users[0].address, false);
    await mockNftOracle.setNFTPrice(users[1].address, 1, 410);
  });

  it("Should revert on multi-paused collections", async () => {
    const { mockNftOracle, users } = testEnv;
    await mockNftOracle.addCollection(users[3].address);

    // Set prices
    await mockNftOracle.setNFTPrice(users[1].address, 1, 100);
    await mockNftOracle.setNFTPrice(users[2].address, 1, 200);
    await mockNftOracle.setNFTPrice(users[3].address, 1, 300);

    // Get prices
    expect(await mockNftOracle.getNFTPrice(users[1].address, 1)).to.be.eq(100);
    expect(await mockNftOracle.getNFTPrice(users[2].address, 1)).to.be.eq(200);
    expect(await mockNftOracle.getNFTPrice(users[3].address, 1)).to.be.eq(300);

    // Pause Collection 1 and try to set a new price:
    await mockNftOracle.setPause(users[1].address, true);
    await expect(
      mockNftOracle.setNFTPrice(users[1].address, 1, 1000)
    ).to.be.revertedWith("NFTPaused()");

    // Unpause Collection 1 + set and get new price:
    await mockNftOracle.setPause(users[1].address, false);
    await mockNftOracle.setNFTPrice(users[1].address, 1, 1000);
    expect(await mockNftOracle.getNFTPrice(users[1].address, 1)).to.be.eq(1000);

    // Pause Collection 2 and 3 and try to set a new price:
    await mockNftOracle.setPause(users[2].address, true);
    await expect(
      mockNftOracle.setNFTPrice(users[2].address, 1, 2000)
    ).to.be.revertedWith("NFTPaused()");
    await mockNftOracle.setPause(users[3].address, true);
    await expect(
      mockNftOracle.setNFTPrice(users[3].address, 1, 3000)
    ).to.be.revertedWith("NFTPaused()");

    // Unpause Collection 2 and 3 + set and get new price:
    await mockNftOracle.setPause(users[2].address, false);
    await mockNftOracle.setNFTPrice(users[2].address, 1, 2000);
    expect(await mockNftOracle.getNFTPrice(users[2].address, 1)).to.be.eq(2000);

    await mockNftOracle.setPause(users[3].address, false);
    await mockNftOracle.setNFTPrice(users[3].address, 1, 3000);
    expect(await mockNftOracle.getNFTPrice(users[3].address, 1)).to.be.eq(3000);
  });
});
