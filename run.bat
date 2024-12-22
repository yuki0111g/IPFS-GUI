set HOME=.
set IPFS_HOME=.ipfs
chcp 65001
java -Xmn500m -Xmx1000m -Xms1000m -cp .;lib/ipfs-ncl.jar;lib/ipfslib.jar;lib/jackson-core-2.15.2.jar;lib/jackson-databind-2.15.2.jar;lib/commons-math-2.0.jar org.peergos.APIServer Addresses.API /ip4/127.0.0.1/tcp/5001
pause;