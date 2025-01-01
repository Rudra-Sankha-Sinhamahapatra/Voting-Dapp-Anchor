import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import IDL from "../target/idl/votingdapp.json";
import { Votingdapp } from "../target/types/votingdapp";
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const votingAddress = new PublicKey(
  "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF"
);

describe("votingdapp", () => {
  let context;
  let provider;
  let votingProgram: Program<Votingdapp>;

  beforeAll(async()=>{
     context = await startAnchor(
      "",
      [{ name: "votingdapp", programId: votingAddress }],
      []
    );
     provider = new BankrunProvider(context);

    votingProgram = new Program<Votingdapp>(IDL as Votingdapp, provider);
  })

  it("Initialize Poll", async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        "What is your favourite type of peanut butter",
        new anchor.BN(0),
        new anchor.BN(1825764070)
      )
      .rpc();

      const [pollAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer,'le',8)],
        votingAddress
      )

      const poll = await votingProgram.account.poll.fetch(pollAddress);

      console.log(poll);

      expect(poll.pollId.toNumber()).toEqual(1);
      expect(poll.description).toEqual("What is your favourite type of peanut butter");
      expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
      expect(poll.pollEnd.toNumber()).toBeGreaterThan(poll.pollStart.toNumber());
  });

  it("initialize candidate",async()=>{
   await votingProgram.methods.initializeCandidate(
    "Smooth",
    new anchor.BN(1),
   ).rpc();
   await votingProgram.methods.initializeCandidate(
    "Crunchy",
    new anchor.BN(1),
   ).rpc();

   const [crunchyAddress] = PublicKey.findProgramAddressSync(
    [new anchor.BN(1).toArrayLike(Buffer,'le',8),Buffer.from("Crunchy")],
    votingAddress
   );

   const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyAddress);
   console.log(crunchyCandidate);

   expect(crunchyCandidate.candidateName).toEqual("Crunchy");
   expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

   const [smoothAddress] = PublicKey.findProgramAddressSync(
    [new anchor.BN(1).toArrayLike(Buffer,'le',8),Buffer.from("Smooth")],
    votingAddress
   );

   const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
   console.log(smoothCandidate);

   expect(smoothCandidate.candidateName).toEqual("Smooth");
   expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("vote",async()=>{
   await votingProgram.methods
   .vote(
    "Smooth",
    new anchor.BN(1)
   ).rpc()

   const [smoothAddress] = PublicKey.findProgramAddressSync(
    [new anchor.BN(1).toArrayLike(Buffer,'le',8),Buffer.from("Smooth")],
    votingAddress
   );

   const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
   console.log(smoothCandidate);

   expect(smoothCandidate.candidateName).toEqual("Smooth");
   expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
  });
});
