require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();
let data = require('./data.js');
let big = require('./util/bigNum.js').big;
let OraclesToken = artifacts.require('OraclesToken');
let {deployTestContracts} = require('./util/deploy.js');

contract('OraclesToken', function(accounts) {
    let {bridgeAddress, tokenContract, treasuryContract} = {};

    beforeEach(async () => {
        ({bridgeAddress, tokenContract, treasuryContract} = await deployTestContracts(accounts));
    });

    it('constructor arguments set totalSupply', async () => {
        let token = await OraclesToken.new(accounts[0], 100, 2);
        10000..should.be.bignumber.equal(await token.totalSupply());
    });

    it('decimals constructor argument', async () => {
        let token = await OraclesToken.new(accounts[0], 100, 2);
        2..should.be.bignumber.equal(await token.decimals());
    });

    it('totalSupply', async() => {
        data.TOTAL_SUPPLY_ITEMS.mul(10**data.DECIMALS).should.be.bignumber.equal(
            await tokenContract.totalSupply()
        );
    });

    it('setTreasury fails for non-owner', async () => {
        await tokenContract.setTreasury(treasuryContract.address, {from: accounts[1]})
            .should.be.rejectedWith('invalid opcode');
    });

    it('setTreasury sets treasury contract', async () => {
        big(0).should.be.bignumber.equal(
            await tokenContract.treasury()
        );
        await tokenContract.setTreasury(treasuryContract.address);
        treasuryContract.address.should.be.equal(
            await tokenContract.treasury()
        );
    });

    it('transfer fails if treasury is not set', async () => {
        await tokenContract.transfer(accounts[1], 100)
            .should.be.rejectedWith('invalid opcode');
    });

    it('transferFrom fails if treasury is not set', async () => {
        await tokenContract.approve(accounts[1], 100);
        await tokenContract.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]})
            .should.be.rejectedWith('invalid opcode');
    });

    it('transfer works if treasury is set', async () => {
        await tokenContract.setTreasury(treasuryContract.address);
        // put some tokens on common accounts[0] balance using bridge account
        await tokenContract.transfer(accounts[0], 100, {from: bridgeAddress});
        await tokenContract.transfer(accounts[1], 100);
        100..should.be.bignumber.equal(
            await tokenContract.balanceOf(accounts[1])
        );
    });

    it('transferFrom works if treasury is set', async () => {
        await tokenContract.setTreasury(treasuryContract.address);
        // put some tokens on common accounts[0] balance using bridge account
        await tokenContract.transfer(accounts[0], 100, {from: bridgeAddress});
        await tokenContract.approve(accounts[1], 100);
        await tokenContract.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
        100..should.be.bignumber.equal(
            await tokenContract.balanceOf(accounts[2])
        );
    });

});
