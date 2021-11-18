const connectBtn = document.querySelector(".connect-btn");
const walletId = document.querySelector("#wallet-id");
const walletSection = document.querySelector(".wallet_btngm");
const disconnectWallet = document.querySelector(".disconnect-wallet");
const ethereumPrice = document.querySelector("#ethereum-price");
const gasSpentInEth = document.querySelector("#gasSpentInEth");
const gasSpentInUSD = document.querySelector("#gasSpentInUSD");
const failedGasInEth = document.querySelector("#failedGasInEth");
const failedTxns = document.querySelector("#failedTxns");
const totalTxns = document.querySelector("#totalTxns");
const averageGwei = document.querySelector("#averageGwei");

const slowGaspriceGwei = document.querySelector("#slowGaspriceGwei");
const slowGaspriceUSD = document.querySelector("#slowGaspriceUSD");
const normalGaspriceGwei = document.querySelector("#normalGaspriceGwei");
const normalGaspriceUSD = document.querySelector("#normalGaspriceUSD");
const fastGaspriceGwei = document.querySelector("#fastGaspriceGwei");
const fastGaspriceUSD = document.querySelector("#fastGaspriceUSD");
const lastUpdatedOutput = document.querySelector("#lastUpdatedOutput");

const apiKey = "7QEMXYNDAD5WT7RTA5TQUCJ5NIA99CSYVI";

let lastUpdatedTimestamp = 0;
let lastUpdated = 0;
let ethereum;
let web3;
let txtMadeByAddress = 0;
let totalGasSpent = 0;
let totalGasUsed = 0;
let numberOfFailedTxs = 0;
let failedGasSpent = 0;

const loadMetaMask = async () => {
	try {
		if (!window.ethereum)
			return alert(
				"Non-Ethereum browser detected. You should consider trying Metamask"
			);
		const Web3 = window.Web3;
		ethereum = window.ethereum;
		web3 = new Web3(ethereum);

		let block = await web3.eth.getBlockNumber();
		let user;

		const _accounts = await ethereum.request({ method: "eth_requestAccounts" });
		user = web3.utils.toChecksumAddress(_accounts[0]);
		lastUpdatedTimestamp = dayjs();
		return {
			block,
			user,
		};
	} catch (err) {
		console.log(err);
	}
};

const main = async () => {
	let { user, block } = await loadMetaMask();
	connectBtn.style.display = "none";
	disconnectWallet.style.visibility = "visible";
	walletSection.style.visibility = "visible";

	walletId.textContent = walletShortener(user);

	const data = await fetchapi(user, block);

	for (let i = 0; i < data.result.length; i++) {
		const element = data.result[i];
		if (element.from == user.toLowerCase()) {
			txtMadeByAddress++;
			totalGasSpent +=
				(Number(element.gasPrice) * Number(element.gasUsed)) / 10 ** 18;
			totalGasUsed += Number(element.gasUsed);
			if (element.isError == 1) {
				numberOfFailedTxs++;
				failedGasSpent += (element.gasPrice * element.gasUsed) / 10 ** 18;
			}
		}
	}

	// getting the average gas price
	const average = await averageGasPricePerTxn(data.result);
	const priceEth = await EthPrice();

	gasSpentInEth.textContent = `${totalGasSpent.toFixed(3)} ETH`;
	gasSpentInUSD.textContent = `${(totalGasSpent * priceEth).toFixed(3)} USD`;
	failedTxns.textContent = numberOfFailedTxs;
	failedGasInEth.textContent = `${(failedGasSpent * priceEth).toFixed(3)} USD`;
	totalTxns.textContent = txtMadeByAddress;
	averageGwei.textContent = parseFloat(average).toFixed(3);

	setInterval(() => _calculateLastUpdatedTime(), 60_000);
};

const walletShortener = (_wallet) => {
	const _split = _wallet.split("");
	let _firstPart = [];
	let _secondPart = [];

	for (let i = 0; i < 5; i++) _firstPart = [..._firstPart, _split[i]];
	for (let i = _split.length - 5; i < _split.length; i++)
		_secondPart = [..._secondPart, _split[i]];

	_firstPart = _firstPart.join("");
	_secondPart = _secondPart.join("");
	return `${_firstPart}...${_secondPart}`;
};

const fetchapi = async (address, current) => {
	try {
		const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=${current}&sort=asc&apikey=${apiKey}`;
		const res = await fetch(url);
		return await res.json();
	} catch (err) {
		console.log(err);
		return err;
	}
};

const getGas = async () => {
	try {
		const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;
		const res = await fetch(url);
		return await res.json();
	} catch (err) {
		console.log(err);
		return err;
	}
};

const averageGasPricePerTxn = async (data) => {
	let _totalGasPriceUsed = 0;

	for (let i = 0; i < data.length; i++)
		_totalGasPriceUsed += parseFloat(
			web3.utils.fromWei(data[i].gasPrice, "gwei")
		);
	_totalGasPriceUsed /= data.length - 1;
	return _totalGasPriceUsed;
};

const EthPrice = async () => {
	try {
		const url = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`;
		const res = await fetch(url);
		let data = await res.json();
		return data.ethereum.usd;
	} catch (err) {
		console.log(err);
	}
};

const displayEstimatedGasPrice = async () => {
	try {
		const { FastGasPrice, ProposeGasPrice, SafeGasPrice, suggestBaseFee } = (
			await getGas()
		).result;
		const _etherPrice = await EthPrice();
		const _gasUsed = 21000;

		slowGaspriceGwei.innerHTML = `<h3 id="slowGaspriceGwei">${SafeGasPrice} <span>gwei</span></h3>`;
		slowGaspriceUSD.textContent = `$${parseFloat(
			(parseFloat(SafeGasPrice) / 10 ** 9) * _gasUsed * _etherPrice
		).toFixed(3)}`;

		normalGaspriceGwei.innerHTML = `<h3 id="normalGaspriceGwei">${ProposeGasPrice} <span>gwei</span></h3>`;
		normalGaspriceUSD.textContent = `$${parseFloat(
			(parseFloat(ProposeGasPrice) / 10 ** 9) * _gasUsed * _etherPrice
		).toFixed(3)} `;

		fastGaspriceGwei.innerHTML = `<h3 id="fastGaspriceGwei">${FastGasPrice} <span>gwei</span></h3>`;
		fastGaspriceUSD.textContent = `${parseFloat(
			(parseFloat(FastGasPrice) / 10 ** 9) * _gasUsed * _etherPrice
		).toFixed(3)}`;
	} catch (error) {
		console.log(error);
		return error;
	}
};

const _calculateLastUpdatedTime = () => {
	const _time1 = lastUpdatedTimestamp;
	const _time2 = dayjs();

	const _diff = _time2.diff(_time1) / 1000;
	const _minutes = parseInt(_diff / 60);
	lastUpdated = `Last Updated: ${_minutes} minutes ago`;
	lastUpdatedOutput.textContent = lastUpdated;
};

(async () => {
	const priceEth = await EthPrice();
	ethereumPrice.textContent = `$${priceEth}`;
	await displayEstimatedGasPrice();
})();

// window.addEventListener("DOMContentLoaded", async () => await main());

connectBtn.addEventListener("click", async () => {
	await main();
});

disconnectWallet.addEventListener("click", async () =>
	window.location.reload()
);
